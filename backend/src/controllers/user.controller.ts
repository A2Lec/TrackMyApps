import { Response } from 'express';
import prisma from '../config/database.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { asyncHandler, createError } from '../middlewares/errorHandler.middleware.js';
import { geminiService } from '../services/gemini.service.js';
import { sendSuccess, validateRequest } from '../utils/response.utils.js';

export const saveGeminiKey = asyncHandler(async (req: AuthRequest, res: Response) => {
  validateRequest(req);
  await geminiService.saveKey(req.userId!, req.body.apiKey);
  return sendSuccess(res, { hasGeminiKey: true });
});

export const deleteGeminiKey = asyncHandler(async (req: AuthRequest, res: Response) => {
  await geminiService.deleteKey(req.userId!);
  return sendSuccess(res, { hasGeminiKey: false });
});

type CsvValue = string | number | boolean | Date | null | undefined;

/**
 * Quote every cell, escape quotes and neutralize spreadsheet formulas
 * (values starting with = + - @ would otherwise run in Excel)
 */
function csvRow(values: CsvValue[]): string {
  return values
    .map((value) => {
      let text = value instanceof Date ? value.toISOString() : String(value ?? '');
      if (/^[=+\-@]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    })
    .join(',');
}

function csvSection<T>(title: string, header: string[], rows: T[], toRow: (row: T) => CsvValue[]): string[] {
  return [`=== ${title} ===`, header.join(','), ...rows.map((row) => csvRow(toRow(row))), ''];
}

/**
 * Export all user data (GDPR Articles 15 and 20), as JSON (default) or CSV
 */
export const exportUserData = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const format = req.query.format === 'csv' ? 'csv' : req.query.format === undefined || req.query.format === 'json' ? 'json' : null;

  if (!format) {
    throw createError('Format non supporté. Utilisez ?format=json ou ?format=csv', 400);
  }

  const [user, applications, documents, reminders, companies] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, createdAt: true, updatedAt: true, emailVerified: true },
    }),
    prisma.application.findMany({
      where: { userId },
      include: { company: { select: { name: true, website: true, location: true } } },
    }),
    prisma.document.findMany({ where: { userId } }),
    prisma.reminder.findMany({
      where: { userId },
      include: { application: { select: { position: true, companyName: true } } },
    }),
    prisma.company.findMany({ where: { userId } }),
  ]);

  if (!user) {
    throw createError('Utilisateur non trouvé', 404);
  }

  if (format === 'json') {
    res.setHeader('Content-Disposition', 'attachment; filename="trackmyapps-export.json"');
    res.json({
      user,
      applications: applications.map(({ company, ...app }) => ({ ...app, companyName: company?.name ?? app.companyName })),
      documents,
      reminders: reminders.map(({ application, ...rem }) => ({
        ...rem,
        applicationTitle: application?.position,
        companyName: application?.companyName,
      })),
      companies,
      exportedAt: new Date().toISOString(),
    });
    return;
  }

  const csv = [
    ...csvSection('USER', ['id', 'email', 'firstName', 'lastName', 'emailVerified', 'createdAt'], [user], (u) => [
      u.id, u.email, u.firstName, u.lastName, u.emailVerified, u.createdAt,
    ]),
    ...csvSection('APPLICATIONS', ['id', 'position', 'company', 'status', 'location', 'salary', 'createdAt', 'notes'], applications, (app) => [
      app.id, app.position, app.company?.name || app.companyName, app.status, app.location, app.salary, app.createdAt, app.notes,
    ]),
    ...csvSection('DOCUMENTS', ['id', 'name', 'type', 'fileName', 'createdAt'], documents, (doc) => [
      doc.id, doc.name, doc.type, doc.fileName, doc.createdAt,
    ]),
    ...csvSection('REMINDERS', ['id', 'title', 'description', 'dueDate', 'isCompleted', 'type'], reminders, (rem) => [
      rem.id, rem.title, rem.description, rem.dueDate, rem.isCompleted, rem.type,
    ]),
    ...csvSection('COMPANIES', ['id', 'name', 'website', 'location', 'industry', 'notes'], companies, (comp) => [
      comp.id, comp.name, comp.website, comp.location, comp.industry, comp.notes,
    ]),
  ];

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="trackmyapps-export.csv"');
  res.send('﻿' + csv.join('\n')); // UTF-8 BOM for Excel
});
