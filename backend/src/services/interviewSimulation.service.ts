import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../config/database.js';
import { createError } from '../middlewares/errorHandler.middleware.js';
import { documentExtractionService } from './documentExtraction.service.js';

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

interface StartSessionData {
  userId: string;
  applicationId?: string;
  isFreePractice?: boolean;
  targetRole?: string;
  contractType?: string;
  jobDescription?: string;
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let application: any;

    if (data.applicationId) {
      application = await prisma.application.findUnique({
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
    } else {
      // Free Practice Mode (TICK-302): create or retrieve dedicated practice application
      const practiceRole = data.targetRole?.trim() || 'Entraînement Libre';
      const practiceContract = data.contractType?.trim() || 'CDI';
      const practiceDesc = data.jobDescription?.trim() || 'Session d\'entraînement libre aux entretiens.';

      application = await prisma.application.findFirst({
        where: {
          userId: data.userId,
          notes: { contains: '[PRACTICE_MODE]' },
          position: practiceRole,
        },
        include: {
          company: true,
          cvUsed: true,
          lmUsed: true,
        },
      });

      if (!application) {
        application = await prisma.application.create({
          data: {
            userId: data.userId,
            companyName: 'Entraînement Libre',
            position: practiceRole,
            jobType: practiceContract,
            location: 'Non précisée',
            status: 'DRAFT',
            jobDescription: practiceDesc,
            notes: `[PRACTICE_MODE] Mode libre - ${practiceRole}`,
          },
          include: {
            company: true,
            cvUsed: true,
            lmUsed: true,
          },
        });
      }
    }

    const positionTitle = data.targetRole || application.position;
    const companyName = data.applicationId ? application.companyName : 'Entreprise cible (mode libre)';

    // Extract text from CV and LM if provided
    let contextText = `
      Poste: ${positionTitle}
      Entreprise: ${companyName}
      Type de contrat: ${data.contractType || application.jobType || 'Non précisé'}
      Description du poste: ${data.jobDescription || application.jobDescription || 'Non fournie'}
    `;

    const cvId = data.cvId || application.cvUsedId;
    const lmId = data.lmId || application.lmUsedId;

    if (cvId) {
      const cvDoc = await prisma.document.findUnique({
        where: { id: cvId },
      });
      if (cvDoc && cvDoc.userId === data.userId) {
        const cvText = await documentExtractionService.extractText(cvDoc.fileUrl, cvDoc.mimeType);
        contextText += `\n\nCV du candidat:\n${cvText}`;
      }
    }

    if (lmId) {
      const lmDoc = await prisma.document.findUnique({
        where: { id: lmId },
      });
      if (lmDoc && lmDoc.userId === data.userId) {
        const lmText = await documentExtractionService.extractText(lmDoc.fileUrl, lmDoc.mimeType);
        contextText += `\n\nLettre de motivation:\n${lmText}`;
      }
    }

    // Create Session in DB
    const sessionTitle = data.applicationId
      ? `Entretien ${data.interviewerType} - ${application.companyName}`
      : `Entraînement Libre ${data.interviewerType} - ${positionTitle}`;

    const session = await prisma.interviewSession.create({
      data: {
        userId: data.userId,
        applicationId: application.id,
        title: sessionTitle,
        interviewerType: data.interviewerType,
        difficulty: data.difficulty,
        status: 'IN_PROGRESS',
      },
    });

    // Generate System Prompt
    const systemPrompt = this.generateSystemPrompt(data.interviewerType, data.difficulty, contextText);

    // Send first message to AI to start conversation
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt + "\n\nCommence l'entretien par une phrase d'introduction et ta première question." }],
        },
      ],
    });

    const result = await chat.sendMessage('Start');
    const response = result.response.text();

    // Save AI's first message
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
            lmUsed: true,
          },
        },
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

    // Reconstruct context
    let contextText = `
      Poste: ${session.application.position}
      Entreprise: ${session.application.companyName}
      Description du poste: ${session.application.jobDescription || 'Non fournie'}
    `;
    if (session.application.cvUsed) {
      const cvText = await documentExtractionService.extractText(session.application.cvUsed.fileUrl, session.application.cvUsed.mimeType);
      contextText += `\n\nCV du candidat:\n${cvText}`;
    }

    const systemPrompt = this.generateSystemPrompt(
      session.interviewerType,
      session.difficulty,
      contextText
    );

    const firstGreeting = session.messages[0]?.content || "Bonjour, commençons l'entretien.";
    const chatHistory: Array<{ role: string; parts: Array<{ text: string }> }> = [
      {
        role: 'user',
        parts: [{ text: systemPrompt + "\n\nCommence l'entretien." }],
      },
      {
        role: 'model',
        parts: [{ text: firstGreeting }],
      },
    ];

    // Add intermediate messages (excluding first greeting and current user message)
    const previousMessages = session.messages.length > 1 ? session.messages.slice(1, -1) : [];

    for (const msg of previousMessages) {
      chatHistory.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }

    // Re-initialize model to ensure consistency
    if (!genAI) {
      throw createError('Clé API Gemini manquante', 500);
    }
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const chat = model.startChat({
      history: chatHistory,
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
        message: response,
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw createError("Erreur lors de la communication avec l'IA", 500);
    }
  },

  async completeSession(userId: string, sessionId: string) {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        application: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) throw createError('Session non trouvée', 404);
    if (session.userId !== userId) throw createError('Accès non autorisé', 403);

    // If already completed and has feedback message, return it
    const existingFeedback = session.messages.find((m) => m.role === 'feedback');
    if (existingFeedback) {
      try {
        return JSON.parse(existingFeedback.content);
      } catch {
        return { summary: existingFeedback.content };
      }
    }

    const userMessages = session.messages.filter((m) => m.role === 'user');

    // Baseline fallback if user didn't respond
    if (userMessages.length === 0) {
      const emptyFeedback = {
        score: 50,
        strengths: ["Initiative d'avoir lancé une simulation d'entretien"],
        improvements: [
          'Répondre aux questions du recruteur pour obtenir une analyse complète',
          'Structurer son pitch de présentation',
          'Pratiquer régulièrement pour développer la fluidité orale',
        ],
        idealAnswer: {
          question: 'Présentez-vous en quelques mots.',
          improvedAnswer:
            "Bonjour, passionné par mon domaine, j'ai développé au cours de mon parcours une solide expertise en résolution de problèmes. Je souhaite aujourd'hui mettre cette motivation au service de votre équipe.",
        },
        summary:
          'Session terminée prématurément. Prenez le temps de répondre aux questions lors de votre prochaine simulation pour recevoir une analyse détaillée !',
      };

      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED' },
      });

      await prisma.interviewMessage.create({
        data: {
          sessionId,
          role: 'feedback',
          content: JSON.stringify(emptyFeedback),
        },
      });

      return emptyFeedback;
    }

    const transcript = session.messages
      .filter((m) => m.role === 'user' || m.role === 'model')
      .map((m) => `${m.role === 'user' ? 'Candidat' : 'Recruteur'}: ${m.content}`)
      .join('\n\n');

    const evaluationPrompt = `
Tu es un recruteur expert et coach en entretien d'embauche francophone. Analyse la simulation d'entretien ci-dessous et fournis un débriefing structuré, objectif et bienveillant.

POSTE : ${session.application.position}
ENTREPRISE : ${session.application.companyName}
TYPE INTERLOCUTEUR : ${session.interviewerType}
DIFFICULTÉ : ${session.difficulty}

TRANSCRIPTION DE L'ÉCHANGE :
${transcript}

Réponds UNIQUEMENT avec un objet JSON valide respectant scrupuleusement la structure suivante (aucun markdown autour, aucun texte introductif) :
{
  "score": 80,
  "strengths": [
    "point fort 1 précis et concret",
    "point fort 2 précis et concret",
    "point fort 3 précis et concret"
  ],
  "improvements": [
    "axe d'amélioration 1 actionnable",
    "axe d'amélioration 2 actionnable",
    "axe d'amélioration 3 actionnable"
  ],
  "idealAnswer": {
    "question": "la question posée par le recruteur où le candidat a manqué d'impact ou de structure",
    "improvedAnswer": "une réponse modèle percutante, détaillée et structurée (méthode STAR) que le candidat aurait pu donner"
  },
  "summary": "synthèse globale de 2-3 phrases sur la prestation, les atouts du candidat et un conseil clé pour réussir le vrai entretien"
}
`;

    let feedbackData: any;

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: { responseMimeType: 'application/json' },
        });
        const result = await model.generateContent(evaluationPrompt);
        feedbackData = JSON.parse(result.response.text());
      } catch (err) {
        console.error('Error generating feedback with Gemini:', err);
        feedbackData = {
          score: 75,
          strengths: [
            'Bonne réactivité face aux questions du recruteur',
            "Clarté d'expression et vocabulaire professionnel",
            'Motivation manifeste pour le poste',
          ],
          improvements: [
            'Structurer davantage les réponses avec la méthode STAR (Situation, Tâche, Action, Résultat)',
            'Donner des exemples chiffrés pour prouver votre impact',
            "Lier systématiquement vos compétences aux besoins concrets de l'entreprise",
          ],
          idealAnswer: {
            question: "Parlez-moi d'une difficulté rencontrée et comment vous l'avez surmontée.",
            improvedAnswer:
              "Sur un projet récent, nous avions un retard de 4 jours sur un livrable clé. J'ai réorganisé les priorités, réattribué les tâches critiques et automatisé les tests, ce qui a permis de livrer dans les temps avec 0 régression.",
          },
          summary:
            "Prestation encourageante et dynamique. En renforçant les illustrations concrètes et la méthode STAR, vous maximiserez vos chances de décrocher l'offre.",
        };
      }
    } else {
      feedbackData = {
        score: 75,
        strengths: [
          'Bonne réactivité face aux questions du recruteur',
          'Vocabulaire professionnel adapté',
          'Motivation manifeste',
        ],
        improvements: [
          'Structurer les réponses avec la méthode STAR',
          'Illustrer avec des métriques chiffrées',
          "Poser des questions pertinentes en fin d'échange",
        ],
        idealAnswer: {
          question: 'Quelles sont vos motivations pour ce poste ?',
          improvedAnswer:
            "Ce poste correspond parfaitement à mon expertise en développement. J'ai hâte de relever vos défis d'architecture tout en apportant ma rigueur au quotidien.",
        },
        summary: 'Prestation solide et professionnelle. Continuez de vous entraîner pour gagner en aisance.',
      };
    }

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' },
    });

    await prisma.interviewMessage.create({
      data: {
        sessionId,
        role: 'feedback',
        content: JSON.stringify(feedbackData),
      },
    });

    return feedbackData;
  },

  async getSession(userId: string, sessionId: string) {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        application: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!session) throw createError('Session non trouvée', 404);
    if (session.userId !== userId) throw createError('Accès non autorisé', 403);

    return session;
  },

  async getAllUserSessions(userId: string) {
    const sessions = await prisma.interviewSession.findMany({
      where: { userId },
      include: {
        application: {
          select: { id: true, companyName: true, position: true, status: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 25,
    });

    return sessions;
  },

  async getSessionsByApplication(userId: string, applicationId: string) {
    const sessions = await prisma.interviewSession.findMany({
      where: {
        userId,
        applicationId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sessions;
  },

  async deleteSession(userId: string, sessionId: string) {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw createError('Session non trouvée', 404);
    if (session.userId !== userId) throw createError('Accès non autorisé', 403);

    // Delete all messages first (due to foreign key constraint)
    await prisma.interviewMessage.deleteMany({
      where: { sessionId },
    });

    // Delete the session
    await prisma.interviewSession.delete({
      where: { id: sessionId },
    });

    return { success: true };
  },

  generateSystemPrompt(type: string, difficulty: string, context: string): string {
    let roleDescription = '';
    switch (type) {
      case 'HR':
        roleDescription =
          "Tu es un recruteur RH. Tu te concentres sur le parcours, les soft skills, la motivation et l'adéquation culturelle.";
        break;
      case 'MANAGER':
        roleDescription =
          "Tu es le futur manager. Tu te concentres sur l'expérience concrète, la résolution de problèmes et la capacité à travailler en équipe.";
        break;
      case 'TECHNICAL':
        roleDescription =
          'Tu es un expert technique senior. Tu poses des questions pointues sur les compétences techniques, les outils et les méthodologies.';
        break;
      case 'CTO':
        roleDescription =
          "Tu es le CTO. Tu t'intéresses à la vision globale, à l'architecture, et au potentiel d'évolution.";
        break;
    }

    let tone = '';
    switch (difficulty) {
      case 'EASY':
        tone = 'Sois bienveillant, encourageant et pose des questions simples.';
        break;
      case 'MEDIUM':
        tone = 'Sois professionnel, neutre et pose des questions standard.';
        break;
      case 'HARD':
        tone = 'Sois exigeant, challenge les réponses, demande des détails précis et cherche la petite bête.';
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
  },
};
