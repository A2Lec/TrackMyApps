import { put, del, head } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';
const uploadDir = process.env.UPLOAD_DIR || './uploads';

export const storageService = {
  /**
   * Upload a file to Vercel Blob (production) or local storage (development)
   */
  async uploadFile(file: Express.Multer.File): Promise<string> {
    if (isProduction) {
      // Sanitize filename for URL safety
      const sanitizedFilename = file.originalname
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/[^a-zA-Z0-9_.-]/g, ''); // Remove unsafe characters

      // Upload to Vercel Blob (file is in memory)
      const blob = await put(sanitizedFilename, file.buffer, {
        access: 'public',
        contentType: file.mimetype,
        addRandomSuffix: true,
      });
      
      return blob.url;
    } else {
      // Local storage (file is already on disk)
      return `/uploads/${file.filename}`;
    }
  },

  /**
   * Delete a file from Vercel Blob (production) or local storage (development)
   */
  async deleteFile(fileUrl: string): Promise<void> {
    if (isProduction) {
      // Delete from Vercel Blob
      await del(fileUrl);
    } else {
      // Delete from local storage
      const filePath = path.join(process.cwd(), fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  },

  /**
   * Best-effort deletion of several files: one failure does not stop the others
   */
  async deleteFiles(fileUrls: string[]): Promise<void> {
    await Promise.all(
      fileUrls.map((url) =>
        this.deleteFile(url).catch((error) => {
          console.error(`Failed to delete file ${url}:`, error);
        })
      )
    );
  },

  /**
   * Check if a file exists
   */
  async fileExists(fileUrl: string): Promise<boolean> {
    if (isProduction) {
      try {
        await head(fileUrl);
        return true;
      } catch {
        return false;
      }
    } else {
      const filePath = path.join(process.cwd(), fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl);
      return fs.existsSync(filePath);
    }
  },

  /**
   * Get the file path for local reading (development only)
   */
  getLocalFilePath(fileUrl: string): string {
    if (isProduction) {
      throw new Error('getLocalFilePath should not be called in production');
    }
    return path.join(process.cwd(), fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl);
  },
};
