import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Vercel serverless entry point: every request is rewritten here (see vercel.json).
 * The app is imported lazily so that an initialization error is logged and
 * answered with a 500 instead of crashing the function.
 */
export default async function apiHandler(req: IncomingMessage, res: ServerResponse) {
  try {
    const { default: app } = await import('../src/app.js');
    return app(req, res);
  } catch (error) {
    console.error('[Vercel] Failed to load the app:', error);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}
