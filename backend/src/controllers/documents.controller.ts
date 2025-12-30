import { Response } from 'express';
import { validationResult } from 'express-validator';
import path from 'path';
import fs from 'fs';
import { documentService } from '../services/documents.service.js';
import { asyncHandler, createError } from '../middlewares/errorHandler.middleware.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export const documentController = {
  getAll: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { type } = req.query;
    const documents = await documentService.getAll(req.userId!, type as any);

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
    const document = await documentService.getById(req.userId!, req.params.id);

    const filePath = path.join(process.cwd(), document.fileUrl.startsWith('/') ? document.fileUrl.slice(1) : document.fileUrl);

    if (!fs.existsSync(filePath)) {
      console.error('File not found at:', filePath);
      throw createError('Fichier non trouvé sur le serveur', 404);
    }

    // Set headers to display inline in browser
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
    res.sendFile(filePath);
  }),

  download: asyncHandler(async (req: AuthRequest, res: Response) => {
    const document = await documentService.getById(req.userId!, req.params.id);

    const filePath = path.join(process.cwd(), document.fileUrl.startsWith('/') ? document.fileUrl.slice(1) : document.fileUrl);

    if (!fs.existsSync(filePath)) {
      console.error('File not found at:', filePath);
      throw createError('Fichier non trouvé sur le serveur', 404);
    }

    res.download(filePath, document.fileName);
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

    const document = await documentService.create(req.userId!, {
      name,
      type,
      version,
      isDefault: isDefault === 'true',
      fileUrl: `/uploads/${req.file.filename}`,
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
