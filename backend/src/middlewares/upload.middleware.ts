import multer from 'multer';
import { createError } from './errorHandler.middleware.js';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const maxSize = parseInt(process.env.MAX_FILE_SIZE || '5242880', 10); // 5MB

// Files are kept in memory and handed to storageService (Vercel Blob or local disk)
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(createError('Format de fichier non autorisé. Seuls PDF et DOCX sont acceptés.', 400));
    }
  },
  limits: {
    fileSize: maxSize,
  },
});
