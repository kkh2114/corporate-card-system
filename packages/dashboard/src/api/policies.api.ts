import apiClient, { mapPaginatedResult } from './client';
import type { ApiResponse, PaginationParams } from '@/types/api.types';
import type { PaginatedResult } from '@corporate-card/shared';
import type { CardPolicy } from '@/types/models.types';

export const policiesApi = {
  getList: async (params: PaginationParams) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResult<CardPolicy>>>(
      '/policies',
      { params }
    );
    return mapPaginatedResult(data.data);
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<CardPolicy>>(`/policies/${id}`);
    return data.data;
  },

  create: async (policy: Partial<CardPolicy>) => {
    const { data } = await apiClient.post<ApiResponse<CardPolicy>>('/policies', policy);
    return data.data;
  },

  update: async (id: string, policy: Partial<CardPolicy>) => {
    const { data } = await apiClient.patch<ApiResponse<CardPolicy>>(
      `/policies/${id}`,
      policy
    );
    return data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/policies/${id}`);
  },

  toggleActive: async (id: string, isActive: boolean) => {
    const { data } = await apiClient.patch<ApiResponse<CardPolicy>>(
      `/policies/${id}/toggle`,
      { isActive }
    );
    return data.data;
  },
};
