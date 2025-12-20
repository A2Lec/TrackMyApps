import { PrismaClient } from '@prisma/client';

console.log('[DB] Database URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing');
console.log('[DB] Node env:', process.env.NODE_ENV);

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['info', 'warn', 'error'] 
    : ['error'],
});

// Test connection on startup
prisma.$connect()
  .then(() => console.log('[DB] ✅ Connected to database'))
  .catch((error) => console.error('[DB] ❌ Connection failed:', error.message));

export default prisma;
