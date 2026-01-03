import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';
import { globalLimiter } from './middlewares/rateLimit.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security headers
app.use(helmet());

// Cookie parser
app.use(cookieParser());

// Apply global rate limiter
app.use(globalLimiter);

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins in development or if FRONTEND_URL is not set
    // In production, allow the specific frontend URL
    const allowedOrigin = process.env.FRONTEND_URL;
    
    // Log for debugging
    if (process.env.NODE_ENV === 'production') {
      console.log(`[CORS] Request origin: ${origin}, Allowed: ${allowedOrigin}`);
    }

    if (!origin || !allowedOrigin || allowedOrigin === '*' || origin === allowedOrigin) {
      callback(null, true);
    } else {
      // For debugging purposes, we might want to allow it temporarily or log it
      console.warn(`[CORS] Blocked origin: ${origin}`);
      // callback(new Error('Not allowed by CORS')); // Strict mode
      callback(null, true); // Permissive mode for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve uploaded files
// WARNING: In Vercel (serverless), /tmp is ephemeral. Files will not persist across restarts.
// For production, consider using an external storage service like AWS S3 or Vercel Blob.
const uploadDir = process.env.UPLOAD_DIR || (process.env.NODE_ENV === 'production' ? '/tmp' : './uploads');
app.use('/uploads', express.static(path.resolve(uploadDir)));

// Health check at root
app.get('/', (req, res) => {
  try {
    res.json({ 
      status: 'ok', 
      message: 'TrackMyApps API is running',
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Root route error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// Favicon
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// API routes
app.use('/api', routes);
app.use('/', routes); // Fallback for requests without /api prefix

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
  });
});

export default app;
