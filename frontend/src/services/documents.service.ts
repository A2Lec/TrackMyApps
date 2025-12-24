import api from './api';
import type { Document, DocumentType } from '@/types';
import { useAuthStore } from '@/store/authStore';

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

  getViewUrl(id: string): string {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const token = useAuthStore.getState().token;
    return `${baseUrl}/documents/view/${id}?token=${token}`;
  },

  async download(id: string, fileName: string): Promise<void> {
    const response = await api.get(`/documents/download/${id}`, {
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },
};
