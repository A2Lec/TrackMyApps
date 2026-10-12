import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

vi.mock('../config/database.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../services/email.service.js', () => ({
  emailService: {
    sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
  },
}));

import prisma from '../config/database.js';
import { emailService } from '../services/email.service.js';
import { authService } from '../services/auth.service.js';

const sha256 = (v: string) => crypto.createHash('sha256').update(v).digest('hex');

describe('Password reset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requestPasswordReset', () => {
    it('returns the same message for an unknown email and sends nothing', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await authService.requestPasswordReset('inconnu@test.fr');

      expect(result.message).toMatch(/Si un compte existe/);
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('stores only a hash of the token and emails the raw token', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'u1', email: 'a@test.fr', firstName: 'Alex', resetTokenExpiry: null,
      } as any);

      const result = await authService.requestPasswordReset('  A@Test.fr ');

      expect(result.message).toMatch(/Si un compte existe/);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'a@test.fr' } });
      const rawToken = vi.mocked(emailService.sendPasswordResetEmail).mock.calls[0][2];
      const data = vi.mocked(prisma.user.update).mock.calls[0][0].data as any;
      expect(data.resetToken).toBe(sha256(rawToken));
      expect(data.resetToken).not.toBe(rawToken);
      const ttl = data.resetTokenExpiry.getTime() - Date.now();
      expect(ttl).toBeGreaterThan(59 * 60 * 1000);
      expect(ttl).toBeLessThanOrEqual(60 * 60 * 1000);
    });

    it('does not send a second email within a minute', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'u1', email: 'a@test.fr', firstName: 'Alex',
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000 - 10 * 1000), // issued 10s ago
      } as any);

      await authService.requestPasswordReset('a@test.fr');

      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('rejects an unknown or expired token', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      await expect(authService.resetPassword('bad', 'Nouveau1!')).rejects.toMatchObject({ statusCode: 400 });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('looks the token up by hash, updates the password and clears the token', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 'u1' } as any);

      await authService.resetPassword('raw-token', 'Nouveau1!');

      const where = vi.mocked(prisma.user.findFirst).mock.calls[0][0]?.where as any;
      expect(where.resetToken).toBe(sha256('raw-token'));
      expect(where.resetTokenExpiry.gt).toBeInstanceOf(Date);

      const data = vi.mocked(prisma.user.update).mock.calls[0][0].data as any;
      expect(await bcrypt.compare('Nouveau1!', data.password)).toBe(true);
      expect(data.resetToken).toBeNull();
      expect(data.resetTokenExpiry).toBeNull();
      expect(data.emailVerified).toBe(true);
    });
  });
});
