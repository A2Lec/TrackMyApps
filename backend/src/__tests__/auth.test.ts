import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

// Mock Prisma
vi.mock('../config/database.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock email service
vi.mock('../services/email.service.js', () => ({
  emailService: {
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  },
}));

import prisma from '../config/database.js';
import { authService } from '../services/auth.service.js';
import { emailService } from '../services/email.service.js';

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new user and return token', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        school: null,
        graduationYear: null,
        fieldOfStudy: null,
        emailVerified: false,
        createdAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
    });

    it('should throw if email already exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'existing' } as any);

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        })
      ).rejects.toThrow('Cet email est déjà utilisé');
    });
  });

  describe('updateProfile email', () => {
    const updatedUser = { id: 'user-1', email: 'new@example.com', firstName: 'Test' };

    it('refuses an email already used by another account', async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({ email: 'me@example.com' } as any)
        .mockResolvedValueOnce({ id: 'other-user' } as any);

      await expect(
        authService.updateProfile('user-1', { email: 'Taken@Example.com' })
      ).rejects.toMatchObject({ message: 'Cet email est déjà utilisé', statusCode: 409 });
      expect(prisma.user.findUnique).toHaveBeenLastCalledWith({
        where: { email: 'taken@example.com' },
        select: { id: true },
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('maps a unique constraint race to a 409', async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({ email: 'me@example.com' } as any)
        .mockResolvedValueOnce(null);
      vi.mocked(prisma.user.update).mockRejectedValue(Object.assign(new Error('Unique'), { code: 'P2002' }));

      await expect(
        authService.updateProfile('user-1', { email: 'new@example.com' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('changes the email, resets verification and sends a new link', async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({ email: 'me@example.com' } as any)
        .mockResolvedValueOnce(null);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

      await authService.updateProfile('user-1', { email: 'new@example.com' });

      const data = vi.mocked(prisma.user.update).mock.calls[0][0].data as Record<string, unknown>;
      expect(data.email).toBe('new@example.com');
      expect(data.emailVerified).toBe(false);
      expect(typeof data.verificationToken).toBe('string');
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'new@example.com',
        'Test',
        data.verificationToken
      );
    });

    it('leaves verification untouched when the email is unchanged', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ email: 'me@example.com' } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({ ...updatedUser, email: 'me@example.com' } as any);

      await authService.updateProfile('user-1', { email: 'me@example.com', firstName: 'New' });

      const data = vi.mocked(prisma.user.update).mock.calls[0][0].data as Record<string, unknown>;
      expect(data).toEqual({ firstName: 'New' });
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return user and token for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        school: null,
        graduationYear: null,
        fieldOfStudy: null,
        emailVerified: true,
        emailNotifications: true,
        relanceFrequency: 7,
        avatarUrl: null,
        resetToken: null,
        resetTokenExpiry: null,
        verificationToken: null,
        verificationTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBeDefined();
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw for invalid email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
      ).rejects.toThrow('Email ou mot de passe incorrect');
    });

    it('should throw for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword1!', 10);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: hashedPassword,
      } as any);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'WrongPassword1!',
        })
      ).rejects.toThrow('Email ou mot de passe incorrect');
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = authService.generateToken('user-123');
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should throw if JWT_SECRET is missing', () => {
      const original = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      expect(() => authService.generateToken('user-123')).toThrow('JWT_SECRET');

      process.env.JWT_SECRET = original;
    });
  });
});
