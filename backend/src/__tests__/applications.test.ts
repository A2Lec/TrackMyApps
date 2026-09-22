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
});
