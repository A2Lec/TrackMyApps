import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// En production, on utilise le proxy Vercel défini dans vercel.json
// En développement, on utilise le proxy Vite
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Authorization header
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and extracting data
api.interceptors.response.use(
  (response) => {
    // Check if response is HTML (likely a 404 or 500 error page from Vercel/Proxy)
    if (typeof response.data === 'string' && response.data.trim().toLowerCase().startsWith('<!doctype html')) {
      return Promise.reject(new Error('Invalid API response: Received HTML instead of JSON. Check API URL configuration.'));
    }

    // If the backend returns { success: true, data: ... }, extract the data
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Don't logout on auth endpoints (login/register failures are expected)
      const url = error.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
