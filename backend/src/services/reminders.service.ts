import prisma from '../config/database.js';
import { createError } from '../middlewares/errorHandler.middleware.js';

interface CreateReminderData {
  applicationId?: string;
  title: string;
  description?: string;
  type: string;
  dueDate: Date;
}

export const reminderService = {
  async getAll(userId: string, includeCompleted = false) {
    const where: any = { userId };
    if (!includeCompleted) {
      where.isCompleted = false;
    }

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        application: {
          select: {
            id: true,
            companyName: true,
            position: true,
            status: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return reminders;
  },

  async getUpcoming(userId: string, days = 7) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const reminders = await prisma.reminder.findMany({
      where: {
        userId,
        isCompleted: false,
        dueDate: {
          lte: endDate,
        },
      },
      include: {
        application: {
          select: {
            id: true,
            companyName: true,
            position: true,
            status: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return reminders;
  },

  async getById(userId: string, id: string) {
    const reminder = await prisma.reminder.findFirst({
      where: { id, userId },
      include: {
        application: true,
      },
    });

    if (!reminder) {
      throw createError('Rappel non trouvé', 404);
    }

    return reminder;
  },

  async create(userId: string, data: CreateReminderData) {
    // Verify application belongs to user if provided
    if (data.applicationId) {
      const application = await prisma.application.findFirst({
        where: { id: data.applicationId, userId },
      });

      if (!application) {
        throw createError('Candidature non trouvée', 404);
      }
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId,
        ...data,
      },
      include: {
        application: {
          select: {
            id: true,
            companyName: true,
            position: true,
            status: true,
          },
        },
      },
    });

    return reminder;
  },

  async update(userId: string, id: string, data: Partial<CreateReminderData & { isCompleted: boolean }>) {
    const existing = await prisma.reminder.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw createError('Rappel non trouvé', 404);
    }

    if (data.applicationId) {
      const application = await prisma.application.findFirst({
        where: { id: data.applicationId, userId },
      });

      if (!application) {
        throw createError('Candidature non trouvée', 404);
      }
    }

    const updateData: any = { ...data };
    if (data.dueDate) {
      updateData.emailSent = false;
    }

    const reminder = await prisma.reminder.update({
      where: { id },
      data: updateData,
      include: {
        application: {
          select: {
            id: true,
            companyName: true,
            position: true,
            status: true,
          },
        },
      },
    });

    return reminder;
  },

  async markAsCompleted(userId: string, id: string) {
    const existing = await prisma.reminder.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw createError('Rappel non trouvé', 404);
    }

    const reminder = await prisma.reminder.update({
      where: { id },
      data: { isCompleted: true },
    });

    return reminder;
  },

  async postpone(userId: string, id: string, newDate: Date) {
    const existing = await prisma.reminder.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw createError('Rappel non trouvé', 404);
    }

    const reminder = await prisma.reminder.update({
      where: { id },
      data: { 
        dueDate: newDate,
        emailSent: false
      },
    });

    return reminder;
  },

  async delete(userId: string, id: string) {
    const existing = await prisma.reminder.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw createError('Rappel non trouvé', 404);
    }

    await prisma.reminder.delete({
      where: { id },
    });

    return { message: 'Rappel supprimé avec succès' };
  },

  async getCount(userId: string) {
    const count = await prisma.reminder.count({
      where: {
        userId,
        isCompleted: false,
        dueDate: {
          lte: new Date(),
        },
      },
    });

    return { count };
  },
};
