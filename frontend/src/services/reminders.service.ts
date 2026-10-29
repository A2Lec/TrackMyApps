import api from './api';
import type { Reminder } from '@/types';

interface CreateReminderData {
  applicationId?: string;
  title: string;
  description?: string;
  type: string;
  dueDate: string;
}

export const remindersService = {
  async getAll(includeCompleted = false): Promise<Reminder[]> {
    const response = await api.get<Reminder[]>(`/reminders?includeCompleted=${includeCompleted}`);
    return response.data;
  },

  async getUpcoming(days = 7): Promise<Reminder[]> {
    const response = await api.get<Reminder[]>(`/reminders/upcoming?days=${days}`);
    return response.data;
  },

  async getCount(): Promise<number> {
    const response = await api.get<{ count: number }>('/reminders/count');
    return response.data.count;
  },

  async getById(id: string): Promise<Reminder> {
    const response = await api.get<Reminder>(`/reminders/${id}`);
    return response.data;
  },

  async create(data: CreateReminderData): Promise<Reminder> {
    const response = await api.post<Reminder>('/reminders', data);
    return response.data;
  },

  async update(
    id: string,
    data: Partial<Omit<CreateReminderData, 'applicationId'> & { applicationId: string | null; isCompleted: boolean }>
  ): Promise<Reminder> {
    const response = await api.put<Reminder>(`/reminders/${id}`, data);
    return response.data;
  },

  async markAsCompleted(id: string): Promise<Reminder> {
    const response = await api.patch<Reminder>(`/reminders/${id}/complete`);
    return response.data;
  },

  async postpone(id: string, newDate: string): Promise<Reminder> {
    const response = await api.patch<Reminder>(`/reminders/${id}/postpone`, { newDate });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/reminders/${id}`);
  },

  /** Ask the backend to send this user's due reminder emails (best effort) */
  async triggerEmailCheck(): Promise<void> {
    await api.get('/cron/reminders').catch(() => undefined);
  },
};
