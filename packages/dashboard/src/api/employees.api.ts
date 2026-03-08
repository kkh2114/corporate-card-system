import apiClient, { mapPaginatedResult } from './client';
import type { ApiResponse, PaginationParams } from '@/types/api.types';
import type { PaginatedResult } from '@corporate-card/shared';
import type { Employee } from '@/types/models.types';

export const employeesApi = {
  getList: async (params: PaginationParams & { search?: string; department?: string }) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResult<Employee>>>(
      '/employees',
      { params }
    );
    return mapPaginatedResult(data.data);
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Employee>>(`/employees/${id}`);
    return data.data;
  },

  create: async (employee: Partial<Employee>) => {
    const { data } = await apiClient.post<ApiResponse<Employee>>('/employees', employee);
    return data.data;
  },

  update: async (id: string, employee: Partial<Employee>) => {
    const { data } = await apiClient.patch<ApiResponse<Employee>>(
      `/employees/${id}`,
      employee
    );
    return data.data;
  },

  updateLimit: async (id: string, monthlyLimit: number) => {
    const { data } = await apiClient.patch<ApiResponse<Employee>>(
      `/employees/${id}/limit`,
      { monthlyLimit }
    );
    return data.data;
  },
};
