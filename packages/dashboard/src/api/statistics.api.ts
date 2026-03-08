import apiClient from './client';
import type { ApiResponse, StatisticsParams, StatisticsOverview } from '@/types/api.types';
import type {
  DailyUsage,
  DepartmentUsage,
  CategoryBreakdown,
} from '@/types/models.types';

export type { StatisticsParams, StatisticsOverview };

export const statisticsApi = {
  getOverview: async (params: StatisticsParams) => {
    const { data } = await apiClient.get<ApiResponse<StatisticsOverview>>(
      '/statistics/overview',
      { params }
    );
    return data.data;
  },

  getDailyTrend: async (params: StatisticsParams) => {
    const { data } = await apiClient.get<ApiResponse<DailyUsage[]>>(
      '/statistics/daily-trend',
      { params }
    );
    return data.data;
  },

  getDepartmentComparison: async (params: StatisticsParams) => {
    const { data } = await apiClient.get<ApiResponse<DepartmentUsage[]>>(
      '/statistics/departments',
      { params }
    );
    return data.data;
  },

  getCategoryAnalysis: async (params: StatisticsParams) => {
    const { data } = await apiClient.get<ApiResponse<CategoryBreakdown[]>>(
      '/statistics/categories',
      { params }
    );
    return data.data;
  },
};
