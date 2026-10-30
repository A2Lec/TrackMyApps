import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const gemini = vi.hoisted(() => ({ keys: [] as string[], countTokens: vi.fn() }));

vi.mock('@google/generative-ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@google/generative-ai')>();
  return {
    ...actual,
    GoogleGenerativeAI: class {
      constructor(apiKey: string) {
        gemini.keys.push(apiKey);
      }
      getGenerativeModel() {
        return { countTokens: gemini.countTokens };
      }
    },
  };
});

vi.mock('../config/database.js', () => ({
  default: {
    $connect: vi.fn(),
    user: { findUnique: vi.fn(), update: vi.fn() },
    interviewSession: { create: vi.fn() },
  },
}));

import { GoogleGenerativeAIFetchError } from '@google/generative-ai';
import prisma from '../config/database.js';
import app from '../app.js';
import { decryptSecret, encryptSecret } from '../utils/encryption.js';

const API_KEY = 'AIzaSyTestKey_0123456789abcdefghijklmn';
const auth = { Authorization: `Bearer ${jwt.sign({ userId: 'user-1' }, process.env.JWT_SECRET!)}` };

describe('Secret encryption', () => {
  it('round-trips and never stores the plaintext', () => {
    const payload = encryptSecret(API_KEY, 'user-1');

    expect(payload).not.toContain(API_KEY);
    expect(payload).not.toBe(encryptSecret(API_KEY, 'user-1')); // random IV
    expect(decryptSecret(payload, 'user-1')).toBe(API_KEY);
  });

  it("refuses a ciphertext copied to another user's row", () => {
    expect(() => decryptSecret(encryptSecret(API_KEY, 'user-1'), 'user-2')).toThrow();
  });

  it('refuses a tampered ciphertext', () => {
    const [version, iv, tag, data] = encryptSecret(API_KEY, 'user-1').split(':');
    const tampered = Buffer.from(data, 'base64');
    tampered[0] ^= 1;
    expect(() => decryptSecret([version, iv, tag, tampered.toString('base64')].join(':'), 'user-1')).toThrow();
  });
});

describe('Personal Gemini API key', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gemini.keys.length = 0;
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1', email: 'user@example.com', emailVerified: true } as never);
  });

  it('checks the key with Gemini, stores it encrypted and never echoes it', async () => {
    gemini.countTokens.mockResolvedValue({ totalTokens: 1 });

    const res = await request(app).put('/api/user/gemini-key').set(auth).send({ apiKey: API_KEY });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ hasGeminiKey: true });
    expect(JSON.stringify(res.body)).not.toContain(API_KEY);
    expect(gemini.keys).toEqual([API_KEY]);

    const stored = vi.mocked(prisma.user.update).mock.calls[0][0].data.geminiApiKey as string;
    expect(stored).not.toContain(API_KEY);
    expect(decryptSecret(stored, 'user-1')).toBe(API_KEY);
  });

  it('rejects a key Gemini does not accept', async () => {
    gemini.countTokens.mockRejectedValue(
      new GoogleGenerativeAIFetchError('API key not valid. Please pass a valid API key.', 400)
    );

    const res = await request(app).put('/api/user/gemini-key').set(auth).send({ apiKey: API_KEY });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalide/);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects malformed keys before calling Gemini', async () => {
    const res = await request(app).put('/api/user/gemini-key').set(auth).send({ apiKey: 'short key!' });

    expect(res.status).toBe(400);
    expect(gemini.keys).toHaveLength(0);
  });

  it('deletes the key', async () => {
    const res = await request(app).delete('/api/user/gemini-key').set(auth);

    expect(res.status).toBe(200);
    expect(vi.mocked(prisma.user.update).mock.calls[0][0]).toMatchObject({
      where: { id: 'user-1' },
      data: { geminiApiKey: null },
    });
  });

  it('asks for a key before starting a simulation', async () => {
    const res = await request(app)
      .post('/api/interview-simulation/start')
      .set(auth)
      .send({ interviewerType: 'HR', difficulty: 'EASY' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Paramètres/);
    expect(prisma.interviewSession.create).not.toHaveBeenCalled();
  });

  it('only exposes whether a key is set at login', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      password: await bcrypt.hash('Password1!', 4),
      geminiApiKey: encryptSecret(API_KEY, 'user-1'),
    } as never);

    const res = await request(app).post('/api/auth/login').send({ email: 'user@example.com', password: 'Password1!' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.hasGeminiKey).toBe(true);
    expect(res.body.data.user).not.toHaveProperty('geminiApiKey');
  });
});
