import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 5000;

console.log('[SERVER] Starting...');
console.log('[SERVER] NODE_ENV:', process.env.NODE_ENV);
console.log('[SERVER] DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing');

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API available at http://localhost:${PORT}/api`);
    console.log(`🏥 Health check at http://localhost:${PORT}/api/health`);
  });
} else {
  console.log('[SERVER] Running in production mode (Vercel serverless)');
}

// Export for Vercel Serverless
export default app;
