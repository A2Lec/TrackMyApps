import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/app.js';

// Ensure app is initialized once
const handler = app;

export default async function apiHandler(req: VercelRequest, res: VercelResponse) {
  // Pass through all requests to Express app
  return handler(req, res);
}
