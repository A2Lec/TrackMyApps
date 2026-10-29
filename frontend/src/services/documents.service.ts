import api from './api';
import { saveBlob } from '@/lib/download';
import type { Document, DocumentType } from '@/types';

export const documentsService = {
  async getAll(type?: DocumentType): Promise<Document[]> {
    const params = type ? `?type=${type}` : '';
    const response = await api.get<Document[]>(`/documents${params}`);
    return response.data;
  },

  async getById(id: string): Promise<Document> {
    const response = await api.get<Document>(`/documents/${id}`);
    return response.data;
  },

  async upload(formData: FormData): Promise<Document> {
    const response = await api.post<Document>('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async update(id: string, data: { name?: string; version?: string; isMain?: boolean; isDefault?: boolean }): Promise<Document> {
    const response = await api.put<Document>(`/documents/${id}`, data);
    return response.data;
  },

  async setAsMain(id: string): Promise<Document> {
    const response = await api.patch<Document>(`/documents/${id}/main`);
    return response.data;
  },

  /**
   * Open a document in a new tab. Files are only served to their owner through
   * the authenticated API, so the tab shows a local copy (object URL).
   */
  async open(id: string): Promise<void> {
    // Opened synchronously, before the request, so popup blockers allow it
    const tab = window.open('', '_blank');
    try {
      const response = await api.get<Blob>(`/documents/view/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(response.data);
      if (tab) {
        tab.location.href = url;
      } else {
        window.location.assign(url);
      }
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      tab?.close();
      throw error;
    }
  },

  async download(id: string, fileName: string): Promise<void> {
    const response = await api.get<Blob>(`/documents/download/${id}`, {
      responseType: 'blob',
    });

    saveBlob(response.data, fileName);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },
};
