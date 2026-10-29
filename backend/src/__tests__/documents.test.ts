import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import os from 'os';
import path from 'path';

vi.mock('../config/database.js', () => ({
  default: {
    $connect: vi.fn(),
    user: { findUnique: vi.fn() },
    document: { findFirst: vi.fn() },
  },
}));

import prisma from '../config/database.js';
import app from '../app.js';

const token = jwt.sign({ userId: 'user-a' }, process.env.JWT_SECRET!);
const auth = { Authorization: `Bearer ${token}` };

describe('Document files', () => {
  let uploadDir: string;

  beforeAll(() => {
    uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tma-uploads-'));
    process.env.UPLOAD_DIR = uploadDir;
    fs.writeFileSync(path.join(uploadDir, 'cv.pdf'), '%PDF-1.4 test');
  });

  afterAll(() => {
    delete process.env.UPLOAD_DIR;
    fs.rmSync(uploadDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-a', email: 'a@example.com', emailVerified: true } as any);
  });

  it('streams the file to its owner without exposing the storage key', async () => {
    vi.mocked(prisma.document.findFirst).mockResolvedValue({
      id: 'doc-1',
      fileUrl: '/uploads/cv.pdf',
      fileName: 'CV Camille é.pdf',
      mimeType: 'application/pdf',
    } as any);

    const res = await request(app).get('/api/documents/download/doc-1').set(auth);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toBe(`attachment; filename*=UTF-8''${encodeURIComponent('CV Camille é.pdf')}`);
    expect(res.headers['cache-control']).toBe('private, no-store');
    expect(res.body.toString()).toBe('%PDF-1.4 test');
    expect(res.headers.location).toBeUndefined();
    expect(vi.mocked(prisma.document.findFirst).mock.calls[0][0]?.where).toEqual({ id: 'doc-1', userId: 'user-a' });
  });

  it("returns 404 for another user's document", async () => {
    vi.mocked(prisma.document.findFirst).mockResolvedValue(null);

    const res = await request(app).get('/api/documents/view/doc-of-b').set(auth);

    expect(res.status).toBe(404);
  });

  it('does not serve uploads as public static files', async () => {
    const res = await request(app).get('/uploads/cv.pdf');

    expect(res.status).toBe(404);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/documents/view/doc-1');

    expect(res.status).toBe(401);
  });
});
