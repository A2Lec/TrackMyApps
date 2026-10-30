import api from './api';
import { saveBlob } from '@/lib/download';
import type { User } from '@/types';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData extends LoginData {
  firstName: string;
  lastName: string;
  school?: string;
  graduationYear?: number;
  field?: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get<User>('/auth/profile');
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<User>('/auth/profile', data);
    return response.data;
  },

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/auth/password', { currentPassword, newPassword });
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  /** GDPR export, downloaded through the API client so it carries the session */
  async exportData(format: 'json' | 'csv'): Promise<void> {
    const response = await api.get<Blob>(`/user/export?format=${format}`, { responseType: 'blob' });
    saveBlob(response.data, `trackmyapps-export.${format}`);
  },

  async saveGeminiKey(apiKey: string): Promise<Pick<User, 'hasGeminiKey'>> {
    const response = await api.put<Pick<User, 'hasGeminiKey'>>('/user/gemini-key', { apiKey });
    return response.data;
  },

  async deleteGeminiKey(): Promise<Pick<User, 'hasGeminiKey'>> {
    const response = await api.delete<Pick<User, 'hasGeminiKey'>>('/user/gemini-key');
    return response.data;
  },

  async deleteAccount(): Promise<void> {
    await api.delete('/auth/account');
  },

  async updatePreferences(emailNotifications: boolean, relanceFrequency: number): Promise<User> {
    const response = await api.put<User>('/auth/preferences', {
      emailNotifications,
      relanceFrequency,
    });
    return response.data;
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/verify-email', { token });
    return response.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/reset-password', { token, password });
    return response.data;
  },

  async resendVerification(): Promise<{ message: string; alreadyVerified?: boolean }> {
    const response = await api.post<{ message: string; alreadyVerified?: boolean }>(
      '/auth/resend-verification'
    );
    return response.data;
  },
};
