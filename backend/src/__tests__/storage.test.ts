import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@vercel/blob', () => ({
  put: vi.fn().mockResolvedValue({ url: 'https://store.private.blob.vercel-storage.com/documents/x.pdf' }),
  del: vi.fn(),
  get: vi.fn(),
}));

import { put } from '@vercel/blob';
import { storageService } from '../services/storage.service.js';

const file = { originalname: 'CV.PDF', mimetype: 'application/pdf', buffer: Buffer.from('%PDF') } as Express.Multer.File;

describe('storageService.uploadFile', () => {
  const saved = { storeId: process.env.BLOB_STORE_ID, token: process.env.BLOB_READ_WRITE_TOKEN };

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.BLOB_STORE_ID;
    delete process.env.BLOB_READ_WRITE_TOKEN;
  });

  afterEach(() => {
    if (saved.storeId !== undefined) process.env.BLOB_STORE_ID = saved.storeId;
    if (saved.token !== undefined) process.env.BLOB_READ_WRITE_TOKEN = saved.token;
  });

  it.each([
    ['BLOB_STORE_ID', 'store_abc'],
    ['BLOB_READ_WRITE_TOKEN', 'vercel_blob_rw_abc_secret'],
  ])('uses the private Blob store when %s is set', async (name, value) => {
    process.env[name] = value;

    const key = await storageService.uploadFile(file);

    expect(put).toHaveBeenCalledWith(expect.stringMatching(/^documents\/.+\.pdf$/), file.buffer, {
      access: 'private',
      contentType: 'application/pdf',
    });
    expect(key).toBe('https://store.private.blob.vercel-storage.com/documents/x.pdf');
  });
});
