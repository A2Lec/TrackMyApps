import { PrismaClient } from '@prisma/client';
import { logInfo, logError } from '../utils/logger.js';

logInfo(`Database URL: ${process.env.DATABASE_URL ? '✓ Set' : '✗ Missing'}`, { context: 'Database' });
logInfo(`Node env: ${process.env.NODE_ENV}`, { context: 'Database' });

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['info', 'warn', 'error']
    : ['error'],
});

// Test connection on startup
prisma.$connect()
  .then(() => logInfo('Connected to database', { context: 'Database' }))
  .catch((error: Error) => logError('Connection failed: ' + error.message, { context: 'Database' }));

export default prisma;
