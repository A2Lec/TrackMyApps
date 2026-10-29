import { put, del, get } from '@vercel/blob';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { logError } from '../utils/logger.js';

/**
 * Documents are stored in a private Vercel Blob store when BLOB_READ_WRITE_TOKEN
 * is set (production), and on the local disk otherwise (development).
 * The stored `fileUrl` is a storage key, never exposed to clients: files are
 * streamed by the backend after the ownership check.
 */
const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const uploadDir = () => path.resolve(process.env.UPLOAD_DIR || './uploads');

const LOCAL_PREFIX = '/uploads/';
// Files uploaded before the switch to a private store live at public URLs
const isLegacyPublicBlob = (fileUrl: string) => fileUrl.includes('.public.blob.vercel-storage.com');

const localPath = (fileUrl: string) => path.join(uploadDir(), path.basename(fileUrl));

export const storageService = {
  /**
   * Store an uploaded file and return its storage key
   */
  async uploadFile(file: Express.Multer.File): Promise<string> {
    const fileName = `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`;

    if (useBlob()) {
      const blob = await put(`documents/${fileName}`, file.buffer, {
        access: 'private',
        contentType: file.mimetype,
      });
      return blob.url;
    }

    await fs.promises.mkdir(uploadDir(), { recursive: true });
    await fs.promises.writeFile(localPath(fileName), file.buffer);
    return `${LOCAL_PREFIX}${fileName}`;
  },

  /**
   * Open a stored file as a readable stream
   */
  async openStream(fileUrl: string): Promise<Readable> {
    if (fileUrl.startsWith(LOCAL_PREFIX)) {
      const filePath = localPath(fileUrl);
      await fs.promises.access(filePath);
      return fs.createReadStream(filePath);
    }

    if (isLegacyPublicBlob(fileUrl)) {
      const response = await fetch(fileUrl);
      if (!response.ok || !response.body) {
        throw new Error(`Failed to fetch legacy blob (${response.status})`);
      }
      return Readable.fromWeb(response.body);
    }

    const result = await get(fileUrl, { access: 'private' });
    if (!result || result.statusCode !== 200) {
      throw new Error('Blob not found');
    }
    return Readable.fromWeb(result.stream);
  },

  /**
   * Read a stored file into memory (text extraction)
   */
  async readFile(fileUrl: string): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of await this.openStream(fileUrl)) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  },

  async deleteFile(fileUrl: string): Promise<void> {
    if (fileUrl.startsWith(LOCAL_PREFIX)) {
      await fs.promises.rm(localPath(fileUrl), { force: true });
      return;
    }
    await del(fileUrl);
  },

  /**
   * Best-effort deletion of several files: one failure does not stop the others
   */
  async deleteFiles(fileUrls: string[]): Promise<void> {
    await Promise.all(
      fileUrls.map((url) =>
        this.deleteFile(url).catch((error) => {
          logError(`Failed to delete file ${url}`, error, { context: 'Storage' });
        })
      )
    );
  },
};
