import axios from 'axios';
import { API_BASE_URL } from '@/constants/config';
import type { PaginatedResponse } from '@/types/api.types';
import type { PaginatedResult } from '@corporate-card/shared';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          localStorage.setItem('accessToken', data.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return apiClient(originalRequest);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

/**
 * Maps backend PaginatedResult<T> ({ data, metadata }) to
 * dashboard PaginatedResponse<T> ({ items, total, page, limit, totalPages }).
 */
export function mapPaginatedResult<T>(result: PaginatedResult<T>): PaginatedResponse<T> {
  return {
    items: result.data,
    total: result.metadata.total,
    page: result.metadata.page,
    limit: result.metadata.limit,
    totalPages: result.metadata.totalPages,
  };
}
