import { Response } from 'express';
import { validationResult } from 'express-validator';
import { pipeline } from 'stream/promises';
import { documentService } from '../services/documents.service.js';
import { storageService } from '../services/storage.service.js';
import { asyncHandler, createError } from '../middlewares/errorHandler.middleware.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

/**
 * Stream a document to its owner. Files are never exposed through a public URL.
 */
async function sendDocument(req: AuthRequest, res: Response, disposition: 'inline' | 'attachment') {
  const document = await documentService.getWithFileUrl(req.userId!, req.params.id);

  let stream;
  try {
    stream = await storageService.openStream(document.fileUrl);
  } catch {
    throw createError('Fichier non trouvé sur le serveur', 404);
  }

  res.setHeader('Content-Type', document.mimeType);
  res.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encodeURIComponent(document.fileName)}`);
  res.setHeader('Cache-Control', 'private, no-store');
  await pipeline(stream, res);
}

export const documentController = {
  getAll: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { type } = req.query;
    const documents = await documentService.getAll(req.userId!, typeof type === 'string' ? type : undefined);

    res.json({
      success: true,
      data: documents,
    });
  }),

  getById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const document = await documentService.getById(req.userId!, req.params.id);

    res.json({
      success: true,
      data: document,
    });
  }),

  view: asyncHandler(async (req: AuthRequest, res: Response) => {
    await sendDocument(req, res, 'inline');
  }),

  download: asyncHandler(async (req: AuthRequest, res: Response) => {
    await sendDocument(req, res, 'attachment');
  }),

  upload: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      throw createError('Aucun fichier uploadé', 400);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError(errors.array()[0].msg, 400);
    }

    const { name, type, version, isDefault } = req.body;

    // Upload file to storage (Vercel Blob in production, local in dev)
    const fileUrl = await storageService.uploadFile(req.file);

    const document = await documentService.create(req.userId!, {
      name,
      type,
      version,
      isDefault: isDefault === 'true',
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });

    res.status(201).json({
      success: true,
      data: document,
    });
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, version, isDefault } = req.body;

    const document = await documentService.update(req.userId!, req.params.id, {
      name,
      version,
      isDefault,
    });

    res.json({
      success: true,
      data: document,
    });
  }),

  setAsMain: asyncHandler(async (req: AuthRequest, res: Response) => {
    const document = await documentService.setAsMain(req.userId!, req.params.id);

    res.json({
      success: true,
      data: document,
    });
  }),

  delete: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await documentService.delete(req.userId!, req.params.id);

    res.json({
      success: true,
      data: result,
    });
  }),
};
