import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database.js';
import { createError } from '../middlewares/errorHandler.middleware.js';
import { emailService } from './email.service.js';
import { storageService } from './storage.service.js';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  school?: string;
  graduationYear?: number;
  field?: string;
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
      throw createError('Cet email est déjà utilisé', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const { field, ...rest } = data;
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24); // 24h expiry

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
    });

    if (!user) {
      throw createError('Email ou mot de passe incorrect', 401);
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      throw createError('Email ou mot de passe incorrect', 401);
    }

    const token = this.generateToken(user.id);

    const { password, resetToken, resetTokenExpiry, verificationToken, verificationTokenExpiry, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
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
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw createError('Utilisateur non trouvé', 404);
    }

    return user;
  },

  async updateProfile(userId: string, data: Partial<RegisterData>) {
    const allowedUpdates: Record<string, unknown> = {};
    if (data.firstName !== undefined) allowedUpdates.firstName = data.firstName;
    if (data.lastName !== undefined) allowedUpdates.lastName = data.lastName;
    if (data.school !== undefined) allowedUpdates.school = data.school;
    if (data.graduationYear !== undefined) allowedUpdates.graduationYear = data.graduationYear;
    if (data.field !== undefined) allowedUpdates.fieldOfStudy = data.field;

    const user = await prisma.user.update({
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

  generateToken(userId: string): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn } as jwt.SignOptions);
  },
};
