import fs from 'fs';
import mammoth from 'mammoth';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

export const documentExtractionService = {
  async extractText(filePath: string, mimeType: string): Promise<string> {
    try {
      if (mimeType === 'application/pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword'
      ) {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
      } else if (mimeType === 'text/plain') {
        return fs.readFileSync(filePath, 'utf-8');
      } else {
        console.warn(`Unsupported mime type for text extraction: ${mimeType}`);
        return '';
      }
    } catch (error) {
      console.error('Error extracting text from document:', error);
      return '';
    }
  },
};
