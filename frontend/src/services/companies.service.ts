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

  async getReviews(id: string): Promise<CompanyReview[]> {
    const response = await api.get<CompanyReview[]>(`/companies/${id}/reviews`);
    return response.data;
  },

  async addReview(companyId: string, data: CreateReviewData): Promise<CompanyReview> {
    const response = await api.post<CompanyReview>(`/companies/${companyId}/reviews`, data);
    return response.data;
  },
};
