import { IncomingMessage, ServerResponse } from 'http';

export default async function apiHandler(req: IncomingMessage, res: ServerResponse) {
  console.log(`[Vercel Function] ${req.method} ${req.url} (v1.0.2 - ${new Date().toISOString()})`);
  
  try {
    // Dynamic import to catch initialization errors
    const appModule = await import('../src/app.js');
    const app = appModule.default;
    return app(req, res);
  } catch (error) {
    console.error('[Vercel Critical Error] Failed to load app:', error);
    res.statusCode = 500;
    res.end('Internal Server Error: Check Vercel logs for details');
  }
}
