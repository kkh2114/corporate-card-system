import apiClient, { mapPaginatedResult } from './client';
import type { ApiResponse, TransactionFilterParams } from '@/types/api.types';
import type { PaginatedResult } from '@corporate-card/shared';
import type { Transaction } from '@/types/models.types';

export const transactionsApi = {
  getList: async (params: TransactionFilterParams) => {
    const { data } = await apiClient.get<
      ApiResponse<PaginatedResult<Transaction>>
    >('/transactions', { params });
    return mapPaginatedResult(data.data);
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Transaction>>(
      `/transactions/${id}`
    );
    return data.data;
  },

  approve: async (id: string) => {
    const { data } = await apiClient.patch<ApiResponse<Transaction>>(
      `/transactions/${id}/approve`
    );
    return data.data;
  },

  reject: async (id: string, reason: string) => {
    const { data } = await apiClient.patch<ApiResponse<Transaction>>(
      `/transactions/${id}/reject`,
      { reason }
    );
    return data.data;
  },

  flag: async (id: string, reason: string) => {
    const { data } = await apiClient.patch<ApiResponse<Transaction>>(
      `/transactions/${id}/flag`,
      { reason }
    );
    return data.data;
  },
};
