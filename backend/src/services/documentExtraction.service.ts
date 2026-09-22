import fs from 'fs';
import mammoth from 'mammoth';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

export const documentExtractionService = {
  async getFileBuffer(filePathOrUrl: string): Promise<Buffer> {
    if (filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://')) {
      const response = await fetch(filePathOrUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file from ${filePathOrUrl}: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    const resolvedPath = path.isAbsolute(filePathOrUrl)
      ? filePathOrUrl
      : path.join(process.cwd(), filePathOrUrl.replace(/^\//, ''));

    return fs.promises.readFile(resolvedPath);
  },

  async extractText(filePathOrUrl: string, mimeType: string): Promise<string> {
    try {
      const dataBuffer = await this.getFileBuffer(filePathOrUrl);

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
        console.warn(`Unsupported mime type for text extraction: ${mimeType}`);
        return '';
      }
    } catch (error) {
      console.error('Error extracting text from document:', error);
      return '';
    }
  },
};
