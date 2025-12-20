import api from './api';
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

  async delete(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },
};
