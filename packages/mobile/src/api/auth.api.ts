import apiClient from './client';
import type { User, Tokens } from '../types/models.types';

interface LoginResponse {
  success: true;
  data: Tokens & { user: User };
}

interface RefreshResponse {
  success: true;
  data: { accessToken: string; expiresIn: number };
}

export const authApi = {
  login: async (employeeId: string, password: string) => {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      employeeId,
      password,
    });
    return response.data.data;
  },

  refresh: async (refreshToken: string) => {
    const response = await apiClient.post<RefreshResponse>(
      '/auth/refresh',
      null,
      { headers: { Authorization: `Bearer ${refreshToken}` } },
    );
    return response.data.data;
  },
};
