import api from './api';
import type { Application, ApplicationStatus, JobType, KanbanColumns } from '@/types';

interface CreateApplicationData {
  companyName: string;
  position: string;
  jobType: JobType;
  location: string;
  status?: ApplicationStatus;
  applicationDate?: string;
  jobUrl?: string;
  salary?: string;
  notes?: string;
  cvUsedId?: string;
  lmUsedId?: string;
  interviewDate?: string;
}

interface ApplicationFilters {
  status?: ApplicationStatus;
  jobType?: JobType;
  search?: string;
}

interface ApplicationStats {
  total: number;
  thisMonth: number;
  interviews: number;
  responseRate: number;
  byStatus: Record<string, number>;
  byJobType: Record<string, number>;
}

export const applicationsService = {
  async getAll(filters: ApplicationFilters = {}): Promise<Application[]> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.jobType) params.append('jobType', filters.jobType);
    if (filters.search) params.append('search', filters.search);
    
    const response = await api.get<Application[]>(`/applications?${params}`);
    return response.data;
  },

  async getByStatus(): Promise<KanbanColumns> {
    const response = await api.get<KanbanColumns>('/applications/kanban');
    return response.data;
  },

  async getById(id: string): Promise<Application> {
    const response = await api.get<Application>(`/applications/${id}`);
    return response.data;
  },

  async getStats(): Promise<ApplicationStats> {
    const response = await api.get<ApplicationStats>('/applications/stats');
    return response.data;
  },

  async create(data: CreateApplicationData): Promise<Application> {
    const response = await api.post<Application>('/applications', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateApplicationData>): Promise<Application> {
    const response = await api.put<Application>(`/applications/${id}`, data);
    return response.data;
  },

  async updateStatus(id: string, status: ApplicationStatus): Promise<Application> {
    const response = await api.patch<Application>(`/applications/${id}/status`, { status });
    return response.data;
  },

  async delete(id: string, deleteCompany: boolean = false): Promise<void> {
    await api.delete(`/applications/${id}?deleteCompany=${deleteCompany}`);
  },
};
