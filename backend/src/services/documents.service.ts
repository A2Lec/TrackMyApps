import { Prisma } from '@prisma/client';
import prisma from '../config/database.js';
import { createError } from '../middlewares/errorHandler.middleware.js';
import { storageService } from './storage.service.js';

// Define type locally since we're using SQLite (no Prisma enums)
type DocumentType = 'CV' | 'LETTRE_MOTIVATION' | 'COVER_LETTER' | 'PORTFOLIO' | 'OTHER';

interface CreateDocumentData {
  name: string;
  type: string;
  version?: string;
  isDefault?: boolean;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export const documentService = {
  async getAll(userId: string, type?: DocumentType) {
    const where: Prisma.DocumentWhereInput = { userId };
    if (type) {
      where.type = type;
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        _count: {
          select: {
            applicationsCV: true,
            applicationsLM: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map(doc => ({
      ...doc,
      usageCount: doc._count.applicationsCV + doc._count.applicationsLM,
    }));
  },

  async getById(userId: string, id: string) {
    const document = await prisma.document.findFirst({
      where: { id, userId },
      include: {
        applicationsCV: {
          select: { id: true, companyName: true, position: true },
        },
        applicationsLM: {
          select: { id: true, companyName: true, position: true },
        },
      },
    });

    if (!document) {
      throw createError('Document non trouvé', 404);
    }

    return document;
  },

  async create(userId: string, data: CreateDocumentData) {
    // If setting as default, unset other default documents of same type
    if (data.isDefault) {
      await prisma.document.updateMany({
        where: { userId, type: data.type, isDefault: true },
        data: { isDefault: false },
      });
    }

    const document = await prisma.document.create({
      data: {
        userId,
        ...data,
      },
    });

    return document;
  },

  async update(userId: string, id: string, data: { name?: string; version?: string; isDefault?: boolean }) {
    const existing = await prisma.document.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw createError('Document non trouvé', 404);
    }

    // If setting as default, unset other default documents of same type
    if (data.isDefault) {
      await prisma.document.updateMany({
        where: { userId, type: existing.type, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const document = await prisma.document.update({
      where: { id },
      data,
    });

    return document;
  },

  async delete(userId: string, id: string) {
    const existing = await prisma.document.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: {
            applicationsCV: true,
            applicationsLM: true,
          },
        },
      },
    });

    if (!existing) {
      throw createError('Document non trouvé', 404);
    }

    const usageCount = existing._count.applicationsCV + existing._count.applicationsLM;
    if (usageCount > 0) {
      throw createError(
        `Ce document est utilisé dans ${usageCount} candidature(s). Supprimez d'abord les associations.`,
        400
      );
    }

    // Delete file from storage
    await storageService.deleteFile(existing.fileUrl);

    await prisma.document.delete({
      where: { id },
    });

    return { message: 'Document supprimé avec succès' };
  },

  async setAsMain(userId: string, id: string) {
    const existing = await prisma.document.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw createError('Document non trouvé', 404);
    }

    // Unset other default documents of same type
    await prisma.document.updateMany({
      where: { userId, type: existing.type, isDefault: true },
      data: { isDefault: false },
    });

    const document = await prisma.document.update({
      where: { id },
      data: { isDefault: true },
    });

    return document;
  },
};
