import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';

// Must mock Prisma before importing app (app imports routes which import services)
vi.mock('../config/database.js', () => ({
  default: {
    $connect: vi.fn(),
    user: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    application: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
    company: { findFirst: vi.fn(), create: vi.fn(), delete: vi.fn() },
    applicationEvent: { create: vi.fn() },
    document: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    reminder: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

vi.mock('../services/email.service.js', () => ({
  emailService: { sendVerificationEmail: vi.fn().mockResolvedValue(undefined) },
}));

import app from '../app.js';

describe('CORS configuration', () => {
  const savedFrontendUrl = process.env.FRONTEND_URL;

  afterEach(() => {
    if (savedFrontendUrl !== undefined) {
      process.env.FRONTEND_URL = savedFrontendUrl;
    } else {
      delete process.env.FRONTEND_URL;
    }
  });

  it('should allow requests when FRONTEND_URL matches origin exactly', async () => {
    process.env.FRONTEND_URL = 'https://myapp.vercel.app';

    const res = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'https://myapp.vercel.app')
      .set('Access-Control-Request-Method', 'POST');

    expect(res.headers['access-control-allow-origin']).toBe('https://myapp.vercel.app');
  });

  it('should allow requests when FRONTEND_URL has trailing slash', async () => {
    process.env.FRONTEND_URL = 'https://myapp.vercel.app/';

    const res = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'https://myapp.vercel.app')
      .set('Access-Control-Request-Method', 'POST');

    expect(res.headers['access-control-allow-origin']).toBe('https://myapp.vercel.app');
  });

  it('should allow requests when FRONTEND_URL has different casing', async () => {
    process.env.FRONTEND_URL = 'https://MyApp.Vercel.App';

    const res = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'https://myapp.vercel.app')
      .set('Access-Control-Request-Method', 'POST');

    expect(res.headers['access-control-allow-origin']).toBe('https://myapp.vercel.app');
  });

  it('should allow all origins when FRONTEND_URL is not set', async () => {
    delete process.env.FRONTEND_URL;

    const res = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'https://anything.example.com')
      .set('Access-Control-Request-Method', 'POST');

    expect(res.headers['access-control-allow-origin']).toBe('https://anything.example.com');
  });

  it('should allow all origins when FRONTEND_URL is *', async () => {
    process.env.FRONTEND_URL = '*';

    const res = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'https://anything.example.com')
      .set('Access-Control-Request-Method', 'POST');

    expect(res.headers['access-control-allow-origin']).toBe('https://anything.example.com');
  });

  it('should block requests from non-matching origins', async () => {
    process.env.FRONTEND_URL = 'https://myapp.vercel.app';

    const res = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'https://evil.example.com')
      .set('Access-Control-Request-Method', 'POST');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('should include credentials header in CORS response', async () => {
    process.env.FRONTEND_URL = 'https://myapp.vercel.app';

    const res = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'https://myapp.vercel.app')
      .set('Access-Control-Request-Method', 'POST');

    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should allow POST login request with valid origin', async () => {
    process.env.FRONTEND_URL = 'https://myapp.vercel.app';

    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'https://myapp.vercel.app')
      .send({ email: 'test@test.com', password: 'test' });

    expect(res.headers['access-control-allow-origin']).toBe('https://myapp.vercel.app');
    // Should get a proper JSON response (not CORS error)
    expect(res.headers['content-type']).toMatch(/json/);
  });
});
