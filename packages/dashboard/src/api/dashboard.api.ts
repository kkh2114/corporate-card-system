import apiClient from './client';
import type { ApiResponse } from '@/types/api.types';
import type {
  DashboardSummary,
  DepartmentUsage,
  DailyUsage,
  CategoryBreakdown,
  ViolationSummary,
} from '@/types/models.types';

export const dashboardApi = {
  getRealtime: async () => {
    const { data } = await apiClient.get<ApiResponse<DashboardSummary>>(
      '/dashboard/realtime'
    );
    return data.data;
  },

  getDepartmentUsage: async () => {
    const { data } = await apiClient.get<ApiResponse<DepartmentUsage[]>>(
      '/dashboard/departments'
    );
    return data.data;
  },

  getDailyUsage: async (startDate: string, endDate: string) => {
    const { data } = await apiClient.get<ApiResponse<DailyUsage[]>>(
      '/dashboard/daily-usage',
      { params: { startDate, endDate } }
    );
    return data.data;
  },

  getCategoryBreakdown: async () => {
    const { data } = await apiClient.get<ApiResponse<CategoryBreakdown[]>>(
      '/dashboard/categories'
    );
    return data.data;
  },

  getViolationSummary: async () => {
    const { data } = await apiClient.get<ApiResponse<ViolationSummary[]>>(
      '/dashboard/violations'
    );
    return data.data;
  },
};
