import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../config/database.js', () => ({
  default: {
    $connect: vi.fn(),
    user: { findUnique: vi.fn(), update: vi.fn() },
    document: { findFirst: vi.fn() },
  },
}));

vi.mock('../services/email.service.js', () => ({
  emailService: { sendPasswordResetEmail: vi.fn() },
}));

import prisma from '../config/database.js';
import app from '../app.js';
import { emailService } from '../services/email.service.js';

const DEMO_EMAIL = 'demo@example.com';
const token = jwt.sign({ userId: 'demo-user' }, process.env.JWT_SECRET!);
const auth = { Authorization: `Bearer ${token}` };

describe('Demo account protection', () => {
  const savedDemoEmail = process.env.DEMO_USER_EMAIL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DEMO_USER_EMAIL = DEMO_EMAIL;
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'demo-user', email: DEMO_EMAIL, emailVerified: true } as any);
  });

  afterAll(() => {
    if (savedDemoEmail === undefined) delete process.env.DEMO_USER_EMAIL;
    else process.env.DEMO_USER_EMAIL = savedDemoEmail;
  });

  it.each([
    ['put', '/api/auth/password'],
    ['put', '/api/auth/profile'],
    ['put', '/api/auth/preferences'],
    ['delete', '/api/auth/account'],
    ['post', '/api/documents'],
    ['delete', '/api/documents/doc-1'],
  ] as const)('refuses %s %s', async (method, path) => {
    const res = await request(app)[method](path).set(auth).send({});

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/compte de démonstration/);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('lets regular users through', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'demo-user', email: 'someone@example.com', emailVerified: true } as any);

    const res = await request(app).delete('/api/documents/doc-1').set(auth);

    // Reaches the controller: the document does not exist
    expect(res.status).toBe(404);
  });

  it('never sends a password reset email for the demo account', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: DEMO_EMAIL });

    expect(res.status).toBe(200);
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});
