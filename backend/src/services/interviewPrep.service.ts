import type { Prisma } from '@prisma/client';
import prisma from '../config/database.js';
import { createError } from '../middlewares/errorHandler.middleware.js';

interface InterviewPrepData {
  question: string;
  answer?: string;
  category: string;
}

export const interviewPrepService = {
  async getAll(userId: string, category?: string) {
    const where: Prisma.InterviewPrepWhereInput = { userId };
    if (category) {
      where.category = category;
    }

    const questions = await prisma.interviewPrep.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return questions;
  },

  async getById(userId: string, id: string) {
    const question = await prisma.interviewPrep.findFirst({
      where: { id, userId },
    });

    if (!question) {
      throw createError('Question non trouvée', 404);
    }

    return question;
  },

  async create(userId: string, data: InterviewPrepData) {
    const question = await prisma.interviewPrep.create({
      data: {
        userId,
        ...data,
      },
    });

    return question;
  },

  async update(userId: string, id: string, data: Partial<InterviewPrepData>) {
    const existing = await prisma.interviewPrep.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw createError('Question non trouvée', 404);
    }

    const question = await prisma.interviewPrep.update({
      where: { id },
      data,
    });

    return question;
  },

  async delete(userId: string, id: string) {
    const existing = await prisma.interviewPrep.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw createError('Question non trouvée', 404);
    }

    await prisma.interviewPrep.delete({
      where: { id },
    });

    return { message: 'Question supprimée avec succès' };
  },

  async getCategories() {
    return [
      { id: 'general', name: 'Questions générales', icon: 'user' },
      { id: 'technical', name: 'Questions techniques', icon: 'code' },
      { id: 'behavioral', name: 'Questions comportementales', icon: 'users' },
    ];
  },

  async getDefaultQuestions() {
    return [
      { category: 'general', question: 'Parlez-moi de vous' },
      { category: 'general', question: 'Quels sont vos points forts ?' },
      { category: 'general', question: 'Quels sont vos points faibles ?' },
      { category: 'general', question: 'Pourquoi voulez-vous travailler chez nous ?' },
      { category: 'general', question: 'Où vous voyez-vous dans 5 ans ?' },
      { category: 'technical', question: 'Expliquez votre projet le plus complexe' },
      { category: 'technical', question: 'Comment gérez-vous les deadlines serrées ?' },
      { category: 'behavioral', question: 'Décrivez un conflit en équipe et comment vous l\'avez résolu' },
      { category: 'behavioral', question: 'Parlez d\'un échec et ce que vous en avez appris' },
      { category: 'behavioral', question: 'Comment priorisez-vous vos tâches ?' },
    ];
  },
};
