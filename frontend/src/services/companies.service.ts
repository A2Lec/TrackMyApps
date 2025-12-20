import api from './api';
import type { Company, CompanyReview } from '@/types';

interface CreateReviewData {
  rating: number;
  comment?: string;
  position: string;
  salary?: string;
  wasHired: boolean;
  interviewExperience?: string;
}

interface CreateCompanyData {
  name: string;
  website?: string;
  industry?: string;
  location?: string;
  size?: string;
  description?: string;
  notes?: string;
}

export const companiesService = {
  async getAll(search?: string): Promise<Company[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await api.get<Company[]>(`/companies${params}`);
    return response.data;
  },

  async search(query: string): Promise<Company[]> {
    const response = await api.get<Company[]>(`/companies/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  async getById(id: string): Promise<Company> {
    const response = await api.get<Company>(`/companies/${id}`);
    return response.data;
  },

  async create(data: CreateCompanyData): Promise<Company> {
    const response = await api.post<Company>('/companies', data);
    return response.data;
  },

  async update(id: string, data: Partial<Company>): Promise<Company> {
    const response = await api.put<Company>(`/companies/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/companies/${id}`);
  },

  async getReviews(id: string): Promise<CompanyReview[]> {
    const response = await api.get<CompanyReview[]>(`/companies/${id}/reviews`);
    return response.data;
  },

  async addReview(companyId: string, data: CreateReviewData): Promise<CompanyReview> {
    const response = await api.post<CompanyReview>(`/companies/${companyId}/reviews`, data);
    return response.data;
  },
};
