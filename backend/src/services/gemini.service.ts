import { GoogleGenerativeAI, GoogleGenerativeAIFetchError, type GenerationConfig } from '@google/generative-ai';
import prisma from '../config/database.js';
import { createError, type ApiError } from '../middlewares/errorHandler.middleware.js';
import { decryptSecret, encryptSecret, isEncryptionConfigured } from '../utils/encryption.js';
import { logError, logWarn } from '../utils/logger.js';

// Gemini model, overridable with GEMINI_MODEL
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const MISSING_KEY_MESSAGE =
  "Ajoutez votre clé API Gemini dans Paramètres > Intelligence artificielle pour utiliser le simulateur d'entretien.";
const INVALID_KEY_MESSAGE =
  'Votre clé API Gemini est invalide ou a été révoquée. Mettez-la à jour dans Paramètres > Intelligence artificielle.';

function assertEncryptionConfigured() {
  if (!isEncryptionConfigured()) {
    throw createError("Le stockage des clés API n'est pas configuré sur ce serveur (ENCRYPTION_KEY manquante).", 503);
  }
}

function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && typeof (error as ApiError).statusCode === 'number';
}

function isInvalidKeyError(error: unknown): boolean {
  if (!(error instanceof GoogleGenerativeAIFetchError)) return false;
  return error.status === 401 || error.status === 403 || (error.status === 400 && /api[_ ]key/i.test(error.message));
}

export const geminiService = {
  /** Model bound to the user's own key: every call is billed to their Google account */
  async getModel(userId: string, generationConfig?: GenerationConfig) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { geminiApiKey: true },
    });
    if (!user?.geminiApiKey) {
      throw createError(MISSING_KEY_MESSAGE, 400);
    }
    assertEncryptionConfigured();

    let apiKey: string;
    try {
      apiKey = decryptSecret(user.geminiApiKey, userId);
    } catch (error) {
      // ENCRYPTION_KEY rotated or payload corrupted: the user has to save the key again
      logWarn(`Stored Gemini key of user ${userId} could not be decrypted: ${String(error)}`, { context: 'Gemini' });
      throw createError(INVALID_KEY_MESSAGE, 400);
    }
    return new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: GEMINI_MODEL, generationConfig });
  },

  /** Check the key against Gemini (countTokens is free), then store it encrypted */
  async saveKey(userId: string, apiKey: string) {
    assertEncryptionConfigured();
    try {
      await new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: GEMINI_MODEL }).countTokens('ping');
    } catch (error) {
      throw this.toHttpError(error, "La clé n'a pas pu être vérifiée auprès de Google. Réessayez dans quelques instants.");
    }
    await prisma.user.update({
      where: { id: userId },
      data: { geminiApiKey: encryptSecret(apiKey, userId) },
      select: { id: true },
    });
  },

  async deleteKey(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { geminiApiKey: null },
      select: { id: true },
    });
  },

  /** Map a Gemini failure to a message the user can act on (their key, their quota) */
  toHttpError(error: unknown, fallbackMessage: string): ApiError {
    if (isApiError(error)) return error;
    if (isInvalidKeyError(error)) return createError(INVALID_KEY_MESSAGE, 400);
    if (error instanceof GoogleGenerativeAIFetchError && error.status === 429) {
      return createError('Le quota de votre clé API Gemini est atteint. Réessayez plus tard ou vérifiez votre offre sur Google AI Studio.', 429);
    }
    logError('Gemini API error', error, { context: 'Gemini' });
    return createError(fallbackMessage, 502);
  },
};
