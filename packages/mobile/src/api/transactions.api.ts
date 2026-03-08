import apiClient from './client';
import type {
  Transaction,
  TransactionDetail,
  PaginatedResponse,
} from '../types/models.types';

interface TransactionQuery {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const transactionsApi = {
  getList: async (query: TransactionQuery = {}) => {
    const response = await apiClient.get<PaginatedResponse<Transaction>>(
      '/transactions',
      { params: query },
    );
    return response.data;
  },

  getDetail: async (id: string) => {
    const response = await apiClient.get<{
      success: true;
      data: TransactionDetail;
    }>(`/transactions/${id}`);
    return response.data.data;
  },

  submitReason: async (id: string, reason: string) => {
    const response = await apiClient.post(`/transactions/${id}/reason`, {
      reason,
    });
    return response.data;
  },
};
