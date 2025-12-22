import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { createError } from '../middlewares/errorHandler.middleware.js';

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
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw createError('Cet email est déjà utilisé', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const { field, ...rest } = data;

    const user = await prisma.user.create({
      data: {
        ...rest,
        password: hashedPassword,
        fieldOfStudy: field,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        school: true,
        graduationYear: true,
        fieldOfStudy: true,
        createdAt: true,
      },
    });

    const token = this.generateToken(user.id);

    return { user, token };
  },

  async login(data: LoginData) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw createError('Email ou mot de passe incorrect', 401);
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      throw createError('Email ou mot de passe incorrect', 401);
    }

    const token = this.generateToken(user.id);

    const { password, resetToken, resetTokenExpiry, ...userWithoutPassword } = user;

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
    const user = await prisma.user.update({
      where: { id: userId },
      data,
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

  generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET || 'default-secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    return jwt.sign({ userId }, secret, { expiresIn } as jwt.SignOptions);
  },
};
