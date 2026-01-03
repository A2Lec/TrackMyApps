import 'dotenv/config';
import app from './app.js';
import { logInfo } from './utils/logger.js';

const PORT = process.env.PORT || 5000;

logInfo('Starting server...', { context: 'SERVER' });
logInfo(`NODE_ENV: ${process.env.NODE_ENV}`, { context: 'SERVER' });
logInfo(`DATABASE_URL: ${process.env.DATABASE_URL ? '✓ Set' : '✗ Missing'}`, { context: 'SERVER' });

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
  process.exit(1);
}

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    logInfo(`Server running on http://localhost:${PORT}`, { context: 'SERVER' });
    logInfo(`API available at http://localhost:${PORT}/api`, { context: 'SERVER' });
    logInfo(`Health check at http://localhost:${PORT}/api/health`, { context: 'SERVER' });
  });
} else {
  logInfo('Running in production mode (Vercel serverless)', { context: 'SERVER' });
}

// Export for Vercel Serverless
export default app;
