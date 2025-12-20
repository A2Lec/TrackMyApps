import api from './api';
import type { DashboardStats, AnalyticsData } from '@/types';

export const analyticsService = {
  async getDashboard(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/analytics/dashboard');
    return response.data;
  },

  async getDetailed(): Promise<AnalyticsData> {
    const response = await api.get<AnalyticsData>('/analytics/detailed');
    return response.data;
  },

  async getStats(): Promise<AnalyticsData> {
    const response = await api.get<AnalyticsData>('/analytics/detailed');
    return response.data;
  },

  async getTimeline(period: string): Promise<{ date: string; count: number }[]> {
    const response = await api.get<{ date: string; count: number }[]>(`/analytics/timeline?period=${period}`);
    return response.data;
  },

  async exportCSV(): Promise<void> {
    const response = await api.get('/analytics/export', {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'candidatures.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
