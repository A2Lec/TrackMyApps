import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/database.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    application: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    company: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    reminder: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    applicationEvent: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../services/email.service.js', () => ({
  emailService: {
    sendVerificationEmail: vi.fn().mockResolvedValue(true),
  },
}));

import prisma from '../config/database.js';
import { authService } from '../services/auth.service.js';
import { reminderService } from '../services/reminders.service.js';
import { applicationService } from '../services/applications.service.js';
import { documentExtractionService } from '../services/documentExtraction.service.js';
import bcrypt from 'bcryptjs';

describe('Audit Remediations & Bug Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('Auth Email Normalization', () => {
    it('normalizes email by trimming and lowercasing during registration', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'u-1',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        school: null,
        graduationYear: null,
        fieldOfStudy: null,
        emailVerified: false,
        createdAt: new Date(),
      } as any);

      await authService.register({
        email: '  John.Doe@EXAMPLE.com  ',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john.doe@example.com' },
      });
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'john.doe@example.com',
          }),
        })
      );
    });

    it('normalizes email during login lookup', async () => {
      const hashed = await bcrypt.hash('Password123!', 10);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'u-1',
        email: 'john.doe@example.com',
        password: hashed,
      } as any);

      const res = await authService.login({
        email: '  JOHN.DOE@EXAMPLE.COM ',
        password: 'Password123!',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john.doe@example.com' },
      });
      expect(res.user.email).toBe('john.doe@example.com');
    });
  });

  describe('Reminders Application Ownership Verification', () => {
    it('throws 404 when updating a reminder with an applicationId not belonging to user', async () => {
      vi.mocked(prisma.reminder.findFirst).mockResolvedValue({
        id: 'rem-1',
        userId: 'user-1',
      } as any);

      // Application does not belong to user-1
      vi.mocked(prisma.application.findFirst).mockResolvedValue(null);

      await expect(
        reminderService.update('user-1', 'rem-1', {
          applicationId: 'unauthorized-app-999',
        })
      ).rejects.toThrow('Candidature non trouvée');

      expect(prisma.application.findFirst).toHaveBeenCalledWith({
        where: { id: 'unauthorized-app-999', userId: 'user-1' },
      });
      expect(prisma.reminder.update).not.toHaveBeenCalled();
    });
  });

  describe('Applications Company Relinking on Update', () => {
    it('creates or links to new company when companyName is modified', async () => {
      vi.mocked(prisma.application.findFirst).mockResolvedValue({
        id: 'app-1',
        userId: 'user-1',
        companyName: 'Old Company',
        companyId: 'comp-old',
        status: 'SENT',
        location: 'Paris',
      } as any);

      vi.mocked(prisma.company.findFirst).mockResolvedValue(null); // No existing company named Stripe
      vi.mocked(prisma.company.create).mockResolvedValue({
        id: 'comp-new',
        name: 'Stripe',
        userId: 'user-1',
      } as any);

      vi.mocked(prisma.application.update).mockResolvedValue({
        id: 'app-1',
        companyName: 'Stripe',
        companyId: 'comp-new',
      } as any);

      await applicationService.update('user-1', 'app-1', {
        companyName: 'Stripe',
      });

      expect(prisma.company.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Stripe',
            userId: 'user-1',
          }),
        })
      );
      expect(prisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyName: 'Stripe',
            companyId: 'comp-new',
          }),
        })
      );
    });
  });

  describe('Document Extraction Safe Buffer Handling', () => {
    it('returns empty string gracefully for non-existent file path without unhandled crash', async () => {
      const res = await documentExtractionService.extractText('/non/existent/file.pdf', 'application/pdf');
      expect(res).toBe('');
    });
  });
});
