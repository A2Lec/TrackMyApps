import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/database.js', () => ({
  default: {
    application: {
      findFirst: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    company: {
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    companyReview: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    document: {
      findFirst: vi.fn(),
    },
    reminder: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    applicationEvent: {
      create: vi.fn(),
    },
  },
}));

import prisma from '../config/database.js';
import { companyService } from '../services/companies.service.js';
import { applicationService } from '../services/applications.service.js';
import { reminderService } from '../services/reminders.service.js';

describe('Ownership checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('companies', () => {
    it('refuses to delete a company owned by another user', async () => {
      vi.mocked(prisma.company.findFirst).mockResolvedValue(null);

      await expect(companyService.delete('user-a', 'company-of-b', true)).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(prisma.company.findFirst).toHaveBeenCalledWith({ where: { id: 'company-of-b', userId: 'user-a' } });
      expect(prisma.application.deleteMany).not.toHaveBeenCalled();
      expect(prisma.company.delete).not.toHaveBeenCalled();
    });

    it('scopes getById to the current user', async () => {
      vi.mocked(prisma.company.findFirst).mockResolvedValue(null);

      await expect(companyService.getById('user-a', 'company-of-b')).rejects.toMatchObject({ statusCode: 404 });
      expect(vi.mocked(prisma.company.findFirst).mock.calls[0][0]?.where).toEqual({ id: 'company-of-b', userId: 'user-a' });
    });

    it('stores only existing review columns', async () => {
      vi.mocked(prisma.company.findFirst).mockResolvedValue({ id: 'c1' } as any);
      vi.mocked(prisma.companyReview.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.companyReview.create).mockResolvedValue({ id: 'r1' } as any);

      await companyService.addReview('user-a', {
        companyId: 'c1',
        rating: 4,
        comment: 'ok',
        position: 'Dev',
        wasHired: false,
        userId: 'user-b',
      } as any);

      expect(prisma.companyReview.create).toHaveBeenCalledWith({
        data: { companyId: 'c1', rating: 4, comment: 'ok', userId: 'user-a' },
      });
    });
  });

  describe('applications', () => {
    it('ignores userId and unknown fields sent in an update body', async () => {
      vi.mocked(prisma.application.findFirst).mockResolvedValue({
        id: 'app-1',
        userId: 'user-a',
        status: 'SENT',
        companyName: 'Acme',
        companyId: 'c1',
        location: 'Paris',
      } as any);
      vi.mocked(prisma.application.update).mockResolvedValue({ id: 'app-1' } as any);

      await applicationService.update('user-a', 'app-1', {
        notes: 'hello',
        userId: 'user-b',
        events: { create: [] },
      } as any);

      const data = vi.mocked(prisma.application.update).mock.calls[0][0].data as Record<string, unknown>;
      expect(data.notes).toBe('hello');
      expect(data).not.toHaveProperty('userId');
      expect(data).not.toHaveProperty('events');
    });

    it("refuses to link another user's document", async () => {
      vi.mocked(prisma.document.findFirst).mockResolvedValue(null);

      await expect(
        applicationService.update('user-a', 'app-1', { cvUsedId: 'doc-of-b' })
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(prisma.application.update).not.toHaveBeenCalled();
    });
  });

  describe('reminders', () => {
    it('always creates the reminder for the authenticated user', async () => {
      vi.mocked(prisma.reminder.create).mockResolvedValue({ id: 'r1' } as any);

      await reminderService.create('user-a', {
        title: 'Relance',
        type: 'FOLLOW_UP',
        dueDate: new Date('2026-10-20T09:00:00Z'),
        userId: 'user-b',
        emailSent: true,
      } as any);

      const data = vi.mocked(prisma.reminder.create).mock.calls[0][0].data as Record<string, unknown>;
      expect(data.userId).toBe('user-a');
      expect(data).not.toHaveProperty('emailSent');
    });

    it('does not let an update move the reminder to another user', async () => {
      vi.mocked(prisma.reminder.findFirst).mockResolvedValue({ id: 'r1', userId: 'user-a' } as any);
      vi.mocked(prisma.reminder.update).mockResolvedValue({ id: 'r1' } as any);

      await reminderService.update('user-a', 'r1', { title: 'x', userId: 'user-b' } as any);

      const data = vi.mocked(prisma.reminder.update).mock.calls[0][0].data as Record<string, unknown>;
      expect(data).toEqual({ title: 'x' });
    });
  });
});
