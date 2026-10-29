import { Prisma } from '@prisma/client';
import prisma from '../config/database.js';
import { createError } from '../middlewares/errorHandler.middleware.js';
import { storageService } from './storage.service.js';

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
  async getAll(userId: string, type?: string) {
    const where: Prisma.DocumentWhereInput = { userId };
    if (type) {
      if (type === 'COVER_LETTER' || type === 'LETTRE_MOTIVATION') {
        where.type = { in: ['COVER_LETTER', 'LETTRE_MOTIVATION'] };
      } else {
        where.type = type;
      }
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        applicationsCV: {
          select: { id: true, companyName: true, position: true },
        },
        applicationsLM: {
          select: { id: true, companyName: true, position: true },
        },
        _count: {
          select: {
            applicationsCV: true,
            applicationsLM: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map(doc => {
      const companies = Array.from(
        new Set([
          ...doc.applicationsCV.map(a => a.companyName),
          ...doc.applicationsLM.map(a => a.companyName),
        ])
      ).filter(Boolean);

      return {
        ...doc,
        type: doc.type === 'COVER_LETTER' ? 'LETTRE_MOTIVATION' : doc.type,
        usageCount: doc._count.applicationsCV + doc._count.applicationsLM,
        companies,
        applications: [...doc.applicationsCV, ...doc.applicationsLM],
      };
    });
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

  /**
   * Same as getById, with the storage key needed to read the file
   */
  async getWithFileUrl(userId: string, id: string) {
    const document = await prisma.document.findFirst({
      where: { id, userId },
      omit: { fileUrl: false },
    });

    if (!document) {
      throw createError('Document non trouvé', 404);
    }

    return document;
  },

  async create(userId: string, data: CreateDocumentData) {
    const normalizedType = data.type === 'COVER_LETTER' ? 'LETTRE_MOTIVATION' : data.type;

    // If setting as default, unset other default documents of same type
    if (data.isDefault) {
      await prisma.document.updateMany({
        where: { userId, type: normalizedType, isDefault: true },
        data: { isDefault: false },
      });
    }

    const document = await prisma.document.create({
      data: {
        userId,
        ...data,
        type: normalizedType,
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
      omit: { fileUrl: false },
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

    await prisma.document.delete({
      where: { id },
    });

    // Best-effort: an orphaned file is better than a document the user cannot delete
    await storageService.deleteFiles([existing.fileUrl]);

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
