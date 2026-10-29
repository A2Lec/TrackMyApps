import mammoth from 'mammoth';
import { createRequire } from 'module';
import { storageService } from './storage.service.js';
import { logError, logWarn } from '../utils/logger.js';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

export const documentExtractionService = {
  async extractText(fileUrl: string, mimeType: string): Promise<string> {
    try {
      const dataBuffer = await storageService.readFile(fileUrl);

      if (mimeType === 'application/pdf') {
        const data = await pdf(dataBuffer);
        return data.text || '';
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword'
      ) {
        const result = await mammoth.extractRawText({ buffer: dataBuffer });
        return result.value || '';
      } else if (mimeType === 'text/plain') {
        return dataBuffer.toString('utf-8');
      } else {
        logWarn(`Unsupported mime type for text extraction: ${mimeType}`, { context: 'DocumentExtraction' });
        return '';
      }
    } catch (error) {
      logError('Error extracting text from document', error, { context: 'DocumentExtraction' });
      return '';
    }
  },
};
