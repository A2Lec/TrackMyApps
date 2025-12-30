import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../config/database.js';
import { createError } from '../middlewares/errorHandler.middleware.js';
import { documentExtractionService } from './documentExtraction.service.js';
import path from 'path';

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

interface StartSessionData {
  userId: string;
  applicationId: string;
  interviewerType: 'HR' | 'MANAGER' | 'TECHNICAL' | 'CTO';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  cvId?: string;
  lmId?: string;
}

export const interviewSimulationService = {
  async startSession(data: StartSessionData) {
    if (!genAI) {
      throw createError('Clé API Gemini manquante. Veuillez configurer GEMINI_API_KEY dans le fichier .env du backend.', 500);
    }
    // Use gemini-2.5-flash which is available in late 2025
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 1. Get Application details (Company, Position, Job Description)
    const application = await prisma.application.findUnique({
      where: { id: data.applicationId },
      include: {
        company: true,
        cvUsed: true,
        lmUsed: true,
      },
    });

    if (!application) {
      throw createError('Candidature non trouvée', 404);
    }

    if (application.userId !== data.userId) {
      throw createError('Accès non autorisé', 403);
    }

    // 2. Extract text from CV and LM if provided
    let contextText = `
      Poste: ${application.position}
      Entreprise: ${application.companyName}
      Description du poste: ${application.jobDescription || 'Non fournie'}
    `;

    // Use explicitly selected documents or fall back to application's default documents
    const cvId = data.cvId || application.cvUsedId;
    const lmId = data.lmId || application.lmUsedId;

    if (cvId) {
      const cvDoc = await prisma.document.findUnique({
        where: { id: cvId }
      });
      if (cvDoc && cvDoc.userId === data.userId) {
        const cvPath = path.join(process.cwd(), cvDoc.fileUrl);
        const cvText = await documentExtractionService.extractText(cvPath, cvDoc.mimeType);
        contextText += `\n\nCV du candidat:\n${cvText}`;
      }
    }

    if (lmId) {
      const lmDoc = await prisma.document.findUnique({
        where: { id: lmId }
      });
      if (lmDoc && lmDoc.userId === data.userId) {
        const lmPath = path.join(process.cwd(), lmDoc.fileUrl);
        const lmText = await documentExtractionService.extractText(lmPath, lmDoc.mimeType);
        contextText += `\n\nLettre de motivation:\n${lmText}`;
      }
    }

    // 3. Create Session in DB
    const session = await prisma.interviewSession.create({
      data: {
        userId: data.userId,
        applicationId: data.applicationId,
        title: `Entretien ${data.interviewerType} - ${application.companyName}`,
        interviewerType: data.interviewerType,
        difficulty: data.difficulty,
        status: 'IN_PROGRESS',
      },
    });

    // 4. Generate System Prompt
    const systemPrompt = this.generateSystemPrompt(data.interviewerType, data.difficulty, contextText);

    // 5. Send first message to AI to start conversation
    // We don't save the system prompt as a message, but we use it to initialize the chat
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt + "\n\nCommence l'entretien par une phrase d'introduction et ta première question." }],
        },
      ],
    });

    const result = await chat.sendMessage("Start");
    const response = result.response.text();

    // 6. Save AI's first message
    await prisma.interviewMessage.create({
      data: {
        sessionId: session.id,
        role: 'model',
        content: response,
      },
    });

    return {
      sessionId: session.id,
      message: response,
    };
  },

  async sendMessage(userId: string, sessionId: string, message: string) {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        application: {
            include: {
                company: true,
                cvUsed: true,
                lmUsed: true
            }
        }
      },
    });

    if (!session) {
      throw createError('Session non trouvée', 404);
    }

    if (session.userId !== userId) {
      throw createError('Accès non autorisé', 403);
    }

    // Save User Message
    await prisma.interviewMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: message,
      },
    });

    // Reconstruct History for Gemini
    // Note: Gemini expects alternating user/model roles.
    // We need to inject the system prompt context again if the session is stateless, 
    // but `startChat` maintains history if we keep the object alive. 
    // Since this is a REST API, we need to rebuild history.
    
    // Re-extract context (could be optimized by caching)
    let contextText = `
      Poste: ${session.application.position}
      Entreprise: ${session.application.companyName}
      Description du poste: ${session.application.jobDescription || 'Non fournie'}
    `;
     if (session.application.cvUsed) {
      const cvPath = path.join(process.cwd(), session.application.cvUsed.fileUrl); 
      const cvText = await documentExtractionService.extractText(cvPath, session.application.cvUsed.mimeType);
      contextText += `\n\nCV du candidat:\n${cvText}`;
    }

    const systemPrompt = this.generateSystemPrompt(
        session.interviewerType as any, 
        session.difficulty as any, 
        contextText
    );

    const history = [
        {
            role: 'user',
            parts: [{ text: systemPrompt + "\n\nCommence l'entretien." }]
        },
        {
            role: 'model',
            parts: [{ text: session.messages[0].content }] // The first AI greeting
        }
    ];

    // Add the rest of the conversation
    // Skip the first message (AI greeting) which we just added manually
    for (let i = 1; i < session.messages.length; i++) {
        const msg = session.messages[i];
        // Map 'user' -> 'user', 'model' -> 'model'
        // Gemini roles are 'user' and 'model'
        history.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        });
    }
    
    // The last message added to DB is the user's current message.
    // However, `history` in `startChat` should contain previous turn.
    // The current message is sent via `sendMessage`.
    // So we remove the last user message from history and send it.
    
    // Actually, simpler approach:
    // 1. Build history of ALL previous messages (excluding the new one)
    // 2. Call sendMessage with the new one.
    
    // Let's rebuild history correctly:
    const chatHistory = [
         {
            role: 'user',
            parts: [{ text: systemPrompt + "\n\nCommence l'entretien." }]
        },
        {
            role: 'model',
            parts: [{ text: session.messages[0].content }] 
        }
    ];

    // Add intermediate messages
    // session.messages includes: [AI_Intro, User_Msg1, AI_Resp1, ..., User_Current_Msg]
    // We want history up to User_Current_Msg
    const previousMessages = session.messages.slice(1, -1); // Exclude first (already added) and last (current)
    
    for (const msg of previousMessages) {
        chatHistory.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        });
    }

    // Re-initialize model to ensure consistency
    if (!genAI) {
      throw createError('Clé API Gemini manquante', 500);
    }
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const chat = model.startChat({
        history: chatHistory
    });

    try {
        const result = await chat.sendMessage(message);
        const response = result.response.text();

        // Save AI Response
        await prisma.interviewMessage.create({
            data: {
                sessionId,
                role: 'model',
                content: response,
            },
        });

        return {
            message: response
        };
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw createError("Erreur lors de la communication avec l'IA", 500);
    }
  },

  async getSession(userId: string, sessionId: string) {
      const session = await prisma.interviewSession.findUnique({
          where: { id: sessionId },
          include: {
              messages: {
                  orderBy: { createdAt: 'asc' }
              }
          }
      });

      if (!session) throw createError('Session non trouvée', 404);
      if (session.userId !== userId) throw createError('Accès non autorisé', 403);

      return session;
  },

  async getSessionsByApplication(userId: string, applicationId: string) {
      const sessions = await prisma.interviewSession.findMany({
          where: {
              userId,
              applicationId
          },
          include: {
              messages: {
                  orderBy: { createdAt: 'asc' }
              },
              _count: {
                  select: { messages: true }
              }
          },
          orderBy: {
              createdAt: 'desc'
          }
      });

      return sessions;
  },

  async deleteSession(userId: string, sessionId: string) {
      const session = await prisma.interviewSession.findUnique({
          where: { id: sessionId }
      });

      if (!session) throw createError('Session non trouvée', 404);
      if (session.userId !== userId) throw createError('Accès non autorisé', 403);

      // Delete all messages first (due to foreign key constraint)
      await prisma.interviewMessage.deleteMany({
          where: { sessionId }
      });

      // Delete the session
      await prisma.interviewSession.delete({
          where: { id: sessionId }
      });

      return { success: true };
  },

  generateSystemPrompt(type: string, difficulty: string, context: string): string {
    let roleDescription = '';
    switch (type) {
      case 'HR':
        roleDescription = "Tu es un recruteur RH. Tu te concentres sur le parcours, les soft skills, la motivation et l'adéquation culturelle.";
        break;
      case 'MANAGER':
        roleDescription = "Tu es le futur manager. Tu te concentres sur l'expérience concrète, la résolution de problèmes et la capacité à travailler en équipe.";
        break;
      case 'TECHNICAL':
        roleDescription = "Tu es un expert technique senior. Tu poses des questions pointues sur les compétences techniques, les outils et les méthodologies.";
        break;
      case 'CTO':
        roleDescription = "Tu es le CTO. Tu t'intéresses à la vision globale, à l'architecture, et au potentiel d'évolution.";
        break;
    }

    let tone = '';
    switch (difficulty) {
      case 'EASY':
        tone = "Sois bienveillant, encourageant et pose des questions simples.";
        break;
      case 'MEDIUM':
        tone = "Sois professionnel, neutre et pose des questions standard.";
        break;
      case 'HARD':
        tone = "Sois exigeant, challenge les réponses, demande des détails précis et cherche la petite bête.";
        break;
    }

    return `
      ${roleDescription}
      ${tone}
      
      CONTEXTE DE LA CANDIDATURE :
      ${context}

      CONSIGNES :
      1. Tu simules un entretien d'embauche.
      2. Ne sors jamais de ton rôle.
      3. Pose UNE SEULE question à la fois. Attends la réponse du candidat.
      4. Adapte tes questions aux réponses du candidat.
      5. Si le candidat donne une réponse vague, demande des précisions.
      6. Parle en français.
      
      IMPORTANT : Tes données (et celles du candidat) sont traitées par Google Gemini. Ne demande pas d'informations personnelles sensibles (numéro de sécu, bancaire, etc.).
    `;
  }
};
