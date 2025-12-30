import { Response } from 'express';
import { validationResult } from 'express-validator';
import path from 'path';
import fs from 'fs';
import { documentService } from '../services/documents.service.js';
import { storageService } from '../services/storage.service.js';
import { asyncHandler, createError } from '../middlewares/errorHandler.middleware.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

const isProduction = process.env.NODE_ENV === 'production';

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

    if (isProduction) {
      // In production, redirect to Vercel Blob URL
      res.redirect(document.fileUrl);
    } else {
      // In development, serve from local storage
      const filePath = storageService.getLocalFilePath(document.fileUrl);

      if (!fs.existsSync(filePath)) {
        console.error('File not found at:', filePath);
        throw createError('Fichier non trouvé sur le serveur', 404);
      }

      // Set headers to display inline in browser
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
      res.sendFile(filePath);
    }
  }),

  download: asyncHandler(async (req: AuthRequest, res: Response) => {
    const document = await documentService.getById(req.userId!, req.params.id);

    if (isProduction) {
      // In production, redirect to Vercel Blob URL with download disposition
      res.redirect(document.fileUrl);
    } else {
      // In development, serve from local storage
      const filePath = storageService.getLocalFilePath(document.fileUrl);

      if (!fs.existsSync(filePath)) {
        console.error('File not found at:', filePath);
        throw createError('Fichier non trouvé sur le serveur', 404);
      }

      res.download(filePath, document.fileName);
    }
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
