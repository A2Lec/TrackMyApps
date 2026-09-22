import { Response } from 'express';
import { analyticsService } from '../services/analytics.service.js';
import { asyncHandler } from '../middlewares/errorHandler.middleware.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export const analyticsController = {
  getDashboard: asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await analyticsService.getDashboardStats(req.userId!);

    res.json({
      success: true,
      data,
    });
  }),

  getDetailed: asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await analyticsService.getDetailedAnalytics(req.userId!);

    res.json({
      success: true,
      data,
    });
  }),

  exportData: asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await analyticsService.exportData(req.userId!);

    const escapeCsvField = (field: unknown): string => {
      if (field === null || field === undefined) return '""';
      const str = String(field);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = [
      'Entreprise',
      'Poste',
      'Type',
      'Localisation',
      'Statut',
      'Date candidature',
      'Salaire',
      'Notes',
    ];

    const rows = data.map(app => [
      app.companyName,
      app.position,
      app.jobType,
      app.location,
      app.status,
      app.applicationDate ? new Date(app.applicationDate).toISOString().split('T')[0] : '',
      app.salary || '',
      app.notes || '',
    ]);

    const csv = '\uFEFF' + [
      headers.map(escapeCsvField).join(','),
      ...rows.map(row => row.map(escapeCsvField).join(',')),
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="candidatures.csv"');
    res.send(csv);
  }),

  getTimeline: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { period } = req.query;
    const data = await analyticsService.getTimeline(req.userId!, period as string);

    res.json({
      success: true,
      data,
    });
  }),
};
