import 'dotenv/config';
import app from './app.js';
import { logInfo } from './utils/logger.js';

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

// On Vercel the app runs as a serverless function (api/index.ts) and must not listen
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    logInfo(`API running on http://localhost:${PORT}/api (health check: /api/health)`, { context: 'SERVER' });
  });
}

export default app;
