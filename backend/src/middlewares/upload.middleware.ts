import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const isProduction = process.env.NODE_ENV === 'production';
const uploadDir = process.env.UPLOAD_DIR || './uploads';

// In production, use memory storage (files will be uploaded to Vercel Blob)
// In development, use disk storage
const storage = isProduction 
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        // Create uploads directory if it doesn't exist (dev only)
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    });

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non autorisé. Seuls PDF et DOCX sont acceptés.'));
  }
};

const maxSize = parseInt(process.env.MAX_FILE_SIZE || '5242880', 10); // 5MB

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxSize,
  },
});
