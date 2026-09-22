import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('../config/database.js', () => ({
  default: {
    application: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    company: {
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    applicationEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import prisma from '../config/database.js';
import { applicationService } from '../services/applications.service.js';

describe('Application Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return paginated applications', async () => {
      const mockApps = [
        { id: 'app-1', companyName: 'Google', position: 'Dev', status: 'SENT' },
        { id: 'app-2', companyName: 'Meta', position: 'SRE', status: 'DRAFT' },
      ];

      vi.mocked(prisma.application.findMany).mockResolvedValue(mockApps as any);
      vi.mocked(prisma.application.count).mockResolvedValue(2);

      const result = await applicationService.getAll('user-1', {}, 1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      // Verify findMany was called with correct skip/take
      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        })
      );
    });

    it('should apply status filter', async () => {
      vi.mocked(prisma.application.findMany).mockResolvedValue([]);
      vi.mocked(prisma.application.count).mockResolvedValue(0);

      await applicationService.getAll('user-1', { status: 'SENT' });

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'SENT' }),
        })
      );
    });

    it('should apply search filter', async () => {
      vi.mocked(prisma.application.findMany).mockResolvedValue([]);
      vi.mocked(prisma.application.count).mockResolvedValue(0);

      await applicationService.getAll('user-1', { search: 'Google' });

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ companyName: expect.objectContaining({ contains: 'Google' }) }),
            ]),
          }),
        })
      );
    });
  });

  describe('getById', () => {
    it('should return an application', async () => {
      const mockApp = { id: 'app-1', companyName: 'Google', userId: 'user-1' };
      vi.mocked(prisma.application.findFirst).mockResolvedValue(mockApp as any);

      const result = await applicationService.getById('user-1', 'app-1');
      expect(result.companyName).toBe('Google');
    });

    it('should throw if not found', async () => {
      vi.mocked(prisma.application.findFirst).mockResolvedValue(null);

      await expect(
        applicationService.getById('user-1', 'nonexistent')
      ).rejects.toThrow('Candidature non trouvée');
    });
  });

  describe('delete', () => {
    it('should delete an application', async () => {
      vi.mocked(prisma.application.findFirst).mockResolvedValue({
        id: 'app-1',
        userId: 'user-1',
        companyId: null,
      } as any);
      vi.mocked(prisma.application.delete).mockResolvedValue({} as any);

      const result = await applicationService.delete('user-1', 'app-1');
      expect(result.message).toBe('Candidature supprimée avec succès');
    });

    it('should throw if application not found', async () => {
      vi.mocked(prisma.application.findFirst).mockResolvedValue(null);

      await expect(
        applicationService.delete('user-1', 'nonexistent')
      ).rejects.toThrow('Candidature non trouvée');
    });
  });

  describe('updateStatus & Status Change Events', () => {
    it('should update status and create an INTERVIEW_SCHEDULED event', async () => {
      const mockExisting = { id: 'app-1', userId: 'user-1', status: 'SENT' };
      const mockUpdated = { id: 'app-1', userId: 'user-1', status: 'INTERVIEW_SCHEDULED' };

      vi.mocked(prisma.application.findFirst).mockResolvedValue(mockExisting as any);
      vi.mocked(prisma.application.update).mockResolvedValue(mockUpdated as any);
      vi.mocked(prisma.applicationEvent.create).mockResolvedValue({} as any);

      const result = await applicationService.updateStatus('user-1', 'app-1', 'INTERVIEW_SCHEDULED');

      expect(result.status).toBe('INTERVIEW_SCHEDULED');
      expect(prisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'app-1' },
          data: expect.objectContaining({ status: 'INTERVIEW_SCHEDULED' }),
        })
      );
      expect(prisma.applicationEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          applicationId: 'app-1',
          type: 'INTERVIEW_SCHEDULED',
          description: expect.stringContaining('SENT → INTERVIEW_SCHEDULED'),
        }),
      });
    });

    it('should not create a status change event if the status is identical', async () => {
      const mockExisting = { id: 'app-1', userId: 'user-1', status: 'SENT' };
      const mockUpdated = { id: 'app-1', userId: 'user-1', status: 'SENT' };

      vi.mocked(prisma.application.findFirst).mockResolvedValue(mockExisting as any);
      vi.mocked(prisma.application.update).mockResolvedValue(mockUpdated as any);

      await applicationService.updateStatus('user-1', 'app-1', 'SENT');

      expect(prisma.applicationEvent.create).not.toHaveBeenCalled();
    });

    it('should throw 404 if application to update does not exist', async () => {
      vi.mocked(prisma.application.findFirst).mockResolvedValue(null);

      await expect(
        applicationService.updateStatus('user-1', 'invalid-id', 'ACCEPTED')
      ).rejects.toThrow('Candidature non trouvée');
    });
  });

  describe('getByStatus (Kanban grouping)', () => {
    it('should partition applications into all 8 canonical kanban columns', async () => {
      const mockList = [
        { id: 'app-1', status: 'DRAFT' },
        { id: 'app-2', status: 'SENT' },
        { id: 'app-3', status: 'VIEWED' },
        { id: 'app-4', status: 'INTERVIEW_SCHEDULED' },
        { id: 'app-5', status: 'AWAITING_RESPONSE' },
        { id: 'app-6', status: 'REJECTED' },
        { id: 'app-7', status: 'ACCEPTED' },
        { id: 'app-8', status: 'GHOSTED' },
      ];

      vi.mocked(prisma.application.findMany).mockResolvedValue(mockList as any);

      const grouped = await applicationService.getByStatus('user-1');

      expect(grouped.DRAFT).toHaveLength(1);
      expect(grouped.SENT).toHaveLength(1);
      expect(grouped.VIEWED).toHaveLength(1);
      expect(grouped.INTERVIEW_SCHEDULED).toHaveLength(1);
      expect(grouped.AWAITING_RESPONSE).toHaveLength(1);
      expect(grouped.REJECTED).toHaveLength(1);
      expect(grouped.ACCEPTED).toHaveLength(1);
      expect(grouped.GHOSTED).toHaveLength(1);
    });
  });
});
