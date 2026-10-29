import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../config/database.js', () => ({
  default: {
    $connect: vi.fn(),
    user: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    interviewSession: { findUnique: vi.fn(), create: vi.fn() },
    interviewMessage: { create: vi.fn() },
  },
}));

vi.mock('../services/email.service.js', () => ({
  emailService: { sendVerificationEmail: vi.fn().mockResolvedValue(true) },
}));

import prisma from '../config/database.js';
import app from '../app.js';

const authHeader = () => `Bearer ${jwt.sign({ userId: 'user-1' }, process.env.JWT_SECRET!)}`;

describe('Security guards', () => {
  const savedFrontendUrl = process.env.FRONTEND_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FRONTEND_URL = 'https://myapp.vercel.app';
  });

  afterEach(() => {
    if (savedFrontendUrl !== undefined) process.env.FRONTEND_URL = savedFrontendUrl;
    else delete process.env.FRONTEND_URL;
  });

  describe('CSRF origin check', () => {
    it('rejects a cross-site form POST carrying the auth cookie', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set('Origin', 'https://evil.example.com')
        .set('Cookie', `token=${authHeader().slice('Bearer '.length)}`)
        .type('form')
        .send({ companyName: 'X', position: 'Y', jobType: 'CDI' });

      expect(res.status).toBe(403);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('rejects the opaque "null" origin of sandboxed frames', async () => {
      const res = await request(app).post('/api/auth/logout').set('Origin', 'null');
      expect(res.status).toBe(403);
    });

    it('lets the frontend origin and requests without Origin through', async () => {
      const fromFrontend = await request(app).post('/api/auth/logout').set('Origin', 'https://myapp.vercel.app');
      const noOrigin = await request(app).post('/api/auth/logout');

      expect(fromFrontend.status).toBe(200);
      expect(noOrigin.status).toBe(200);
    });

    it('does not block reads from other origins (CORS hides the response)', async () => {
      const res = await request(app).get('/api/health').set('Origin', 'https://evil.example.com');
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('refuses a non-string token instead of turning it into a Prisma filter', async () => {
      const res = await request(app).post('/api/auth/verify-email').send({ token: { not: '' } });

      expect(res.status).toBe(400);
      expect(prisma.user.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('Interview simulator', () => {
    beforeEach(() => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1', emailVerified: true } as never);
    });

    it('requires a verified email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1', emailVerified: false } as never);

      const res = await request(app)
        .post('/api/interview-simulation/session-1/message')
        .set('Authorization', authHeader())
        .send({ message: 'Bonjour' });

      expect(res.status).toBe(403);
      expect(prisma.interviewSession.findUnique).not.toHaveBeenCalled();
    });

    it('rejects oversized messages before they reach Gemini', async () => {
      const res = await request(app)
        .post('/api/interview-simulation/session-1/message')
        .set('Authorization', authHeader())
        .send({ message: 'a'.repeat(4001) });

      expect(res.status).toBe(400);
      expect(prisma.interviewSession.findUnique).not.toHaveBeenCalled();
    });

    it('rejects an unknown interviewer type', async () => {
      const res = await request(app)
        .post('/api/interview-simulation/start')
        .set('Authorization', authHeader())
        .send({ interviewerType: 'ADMIN', difficulty: 'EASY' });

      expect(res.status).toBe(400);
    });
  });
});
