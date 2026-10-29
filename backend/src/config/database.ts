import { PrismaClient } from '@prisma/client';
import { logInfo, logError } from '../utils/logger.js';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['info', 'warn', 'error']
    : ['error'],
  // Storage keys never leave the backend: files are only served through the
  // authenticated /documents routes. Opt back in with `omit: { fileUrl: false }`.
  omit: {
    document: { fileUrl: true },
  },
});

// Test connection on startup
prisma.$connect()
  .then(() => logInfo('Connected to database', { context: 'Database' }))
  .catch((error: Error) => logError('Connection failed: ' + error.message, { context: 'Database' }));

export default prisma;
