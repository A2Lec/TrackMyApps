/**
 * One-off migration: copy documents uploaded to the former public Vercel Blob
 * store into the private store, then point the database at the new keys.
 *
 * Usage (from backend/):
 *   DATABASE_URL=... BLOB_READ_WRITE_TOKEN=<private store> \
 *   [LEGACY_BLOB_READ_WRITE_TOKEN=<public store>] npm run blob:migrate -- [--dry-run]
 *
 * With LEGACY_BLOB_READ_WRITE_TOKEN, the public copies are deleted once migrated.
 */
import 'dotenv/config';
import path from 'path';
import { randomUUID } from 'crypto';
import { put, del } from '@vercel/blob';
import prisma from '../config/database.js';
import { storageService } from '../services/storage.service.js';

const dryRun = process.argv.includes('--dry-run');

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN (private store) is required');
  }

  const documents = await prisma.document.findMany({
    where: { fileUrl: { contains: '.public.blob.vercel-storage.com' } },
    select: { id: true, fileUrl: true, fileName: true, mimeType: true },
  });

  console.log(`${documents.length} document(s) to migrate${dryRun ? ' (dry run)' : ''}`);

  let failures = 0;
  for (const doc of documents) {
    try {
      if (dryRun) {
        console.log(`- ${doc.id} ${doc.fileName}`);
        continue;
      }

      const buffer = await storageService.readFile(doc.fileUrl);
      const extension = path.extname(doc.fileName).toLowerCase();
      const blob = await put(`documents/${randomUUID()}${extension}`, buffer, {
        access: 'private',
        contentType: doc.mimeType,
      });

      await prisma.document.update({ where: { id: doc.id }, data: { fileUrl: blob.url } });

      if (process.env.LEGACY_BLOB_READ_WRITE_TOKEN) {
        await del(doc.fileUrl, { token: process.env.LEGACY_BLOB_READ_WRITE_TOKEN });
      }
      console.log(`✓ ${doc.id} ${doc.fileName}`);
    } catch (error) {
      failures++;
      console.error(`✗ ${doc.id} ${doc.fileName}:`, error);
    }
  }

  if (failures > 0) {
    throw new Error(`${failures} document(s) could not be migrated`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
