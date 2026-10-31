import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database.js';
import { createError } from '../middlewares/errorHandler.middleware.js';
import { emailService } from './email.service.js';
import { storageService } from './storage.service.js';
import { isDemoEmail } from './demo.service.js';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  school?: string;
  graduationYear?: number;
  field?: string;
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h
const RESET_RESEND_DELAY_MS = 60 * 1000;

const EMAIL_TAKEN_MESSAGE = 'Cet email est déjà utilisé';

// Prisma unique constraint violation: two concurrent requests passed the existence check
function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002';
}

function newVerificationToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24); // 24h expiry
  return { token, expiry };
}

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  async register(data: RegisterData) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw createError(EMAIL_TAKEN_MESSAGE, 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const { field, ...rest } = data;
    
    const { token: verificationToken, expiry: verificationTokenExpiry } = newVerificationToken();

    const user = await prisma.user.create({
      data: {
        ...rest,
        email: normalizedEmail,
        password: hashedPassword,
        fieldOfStudy: field,
        verificationToken,
        verificationTokenExpiry,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        school: true,
        graduationYear: true,
        fieldOfStudy: true,
        emailVerified: true,
        createdAt: true,
      },
    }).catch((error: unknown) => {
      if (isUniqueConstraintError(error)) {
        throw createError(EMAIL_TAKEN_MESSAGE, 409);
      }
      throw error;
    });

    // Send verification email
    await emailService.sendVerificationEmail(user.email, user.firstName, verificationToken);

    const token = this.generateToken(user.id);

    return { user, token };
  },

  async login(data: LoginData) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      omit: { geminiApiKey: false },
    });

    if (!user) {
      throw createError('Email ou mot de passe incorrect', 401);
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      throw createError('Email ou mot de passe incorrect', 401);
    }

    const token = this.generateToken(user.id);

    const { password, resetToken, resetTokenExpiry, verificationToken, verificationTokenExpiry, geminiApiKey, ...userWithoutPassword } = user;

    return {
      user: { ...userWithoutPassword, hasGeminiKey: Boolean(geminiApiKey), isDemo: isDemoEmail(user.email) },
      token,
    };
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        school: true,
        graduationYear: true,
        fieldOfStudy: true,
        avatarUrl: true,
        emailNotifications: true,
        relanceFrequency: true,
        emailVerified: true,
        geminiApiKey: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw createError('Utilisateur non trouvé', 404);
    }

    const { geminiApiKey, ...profile } = user;
    return { ...profile, hasGeminiKey: Boolean(geminiApiKey), isDemo: isDemoEmail(user.email) };
  },

  async updateProfile(userId: string, data: Partial<RegisterData>) {
    const allowedUpdates: Record<string, unknown> = {};
    if (data.firstName !== undefined) allowedUpdates.firstName = data.firstName;
    if (data.lastName !== undefined) allowedUpdates.lastName = data.lastName;
    if (data.school !== undefined) allowedUpdates.school = data.school;
    if (data.graduationYear !== undefined) allowedUpdates.graduationYear = data.graduationYear;
    if (data.field !== undefined) allowedUpdates.fieldOfStudy = data.field;

    let verificationToken: string | null = null;

    if (data.email !== undefined) {
      const current = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (!current) {
        throw createError('Utilisateur non trouvé', 404);
      }

      const normalizedEmail = data.email.trim().toLowerCase();
      if (normalizedEmail !== current.email) {
        // One address per account: refuse an address already used by another account
        const owner = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true },
        });
        if ((owner && owner.id !== userId) || isDemoEmail(normalizedEmail)) {
          throw createError(EMAIL_TAKEN_MESSAGE, 409);
        }

        // The new address must be verified again before write routes are allowed
        const verification = newVerificationToken();
        verificationToken = verification.token;
        allowedUpdates.email = normalizedEmail;
        allowedUpdates.emailVerified = false;
        allowedUpdates.verificationToken = verification.token;
        allowedUpdates.verificationTokenExpiry = verification.expiry;
      }
    }

    let user;
    try {
      user = await prisma.user.update({
        where: { id: userId },
        data: allowedUpdates,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          school: true,
          graduationYear: true,
          fieldOfStudy: true,
          avatarUrl: true,
          emailNotifications: true,
          relanceFrequency: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw createError(EMAIL_TAKEN_MESSAGE, 409);
      }
      throw error;
    }

    if (verificationToken) {
      await emailService.sendVerificationEmail(user.email, user.firstName, verificationToken);
    }

    return user;
  },

  async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw createError('Utilisateur non trouvé', 404);
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      throw createError('Mot de passe actuel incorrect', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Mot de passe mis à jour avec succès' };
  },

  async updatePreferences(userId: string, emailNotifications: boolean, relanceFrequency: number) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { emailNotifications, relanceFrequency },
      select: {
        id: true,
        emailNotifications: true,
        relanceFrequency: true,
      },
    });

    return user;
  },

  async deleteAccount(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw createError('Utilisateur non trouvé', 404);
    }

    const documents = await prisma.document.findMany({
      where: { userId },
      select: { fileUrl: true },
    });

    await prisma.user.delete({
      where: { id: userId },
    });

    // Remove stored files too (public Blob URLs would otherwise outlive the account)
    await storageService.deleteFiles(documents.map((d) => d.fileUrl));

    return { message: 'Compte supprimé avec succès' };
  },

  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw createError('Token de vérification invalide ou expiré', 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    return { message: 'Email vérifié avec succès' };
  },

  async resendVerificationEmail(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw createError('Utilisateur non trouvé', 404);
    }

    // Already verified: nothing to send, but report it so the client can resync its state
    if (user.emailVerified) {
      return { message: 'Votre email est déjà vérifié', alreadyVerified: true };
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24);

    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationToken,
        verificationTokenExpiry,
      },
    });

    // Send verification email
    await emailService.sendVerificationEmail(user.email, user.firstName, verificationToken);

    return { message: 'Email de vérification renvoyé', alreadyVerified: false };
  },

  async requestPasswordReset(email: string) {
    // Same answer whether or not the account exists, so the form cannot be used to probe emails
    const genericResponse = {
      message: 'Si un compte existe pour cette adresse, un email de réinitialisation vient d\'être envoyé.',
    };

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // The shared demo account's password must not be reset by visitors
    if (!user || isDemoEmail(user.email)) {
      return genericResponse;
    }

    // Anti-spam: at most one email per minute per account
    const now = Date.now();
    if (user.resetTokenExpiry && user.resetTokenExpiry.getTime() - RESET_TOKEN_TTL_MS + RESET_RESEND_DELAY_MS > now) {
      return genericResponse;
    }

    // Only a hash is stored: a database leak does not expose usable reset links
    const resetToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashResetToken(resetToken),
        resetTokenExpiry: new Date(now + RESET_TOKEN_TTL_MS),
      },
    });

    await emailService.sendPasswordResetEmail(user.email, user.firstName, resetToken);

    return genericResponse;
  },

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashResetToken(token),
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw createError('Lien de réinitialisation invalide ou expiré', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        // Opening the link sent by email proves ownership of the address
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    return { message: 'Mot de passe réinitialisé avec succès' };
  },

  generateToken(userId: string): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn } as jwt.SignOptions);
  },
};
