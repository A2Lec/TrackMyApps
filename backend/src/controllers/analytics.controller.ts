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

    // Convert to CSV format
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
      app.applicationDate.toISOString().split('T')[0],
      app.salary || '',
      (app.notes || '').replace(/,/g, ';'),
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=candidatures.csv');
    res.send(csv);
  }),
};
