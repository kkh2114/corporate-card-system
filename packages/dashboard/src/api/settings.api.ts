import apiClient from './client';
import type { ApiResponse } from '@/types/api.types';

export interface SettingItem {
  key: string;
  value: string;
  isEncrypted: boolean;
}

export interface ConnectionStatus {
  category: string;
  configured: boolean;
  connected: boolean | null;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
}

export const settingsApi = {
  getSetupRequired: async (): Promise<boolean> => {
    const { data } = await apiClient.get<ApiResponse<{ setupRequired: boolean }>>(
      '/settings/setup-required',
    );
    return data.data.setupRequired;
  },

  getStatus: async (): Promise<ConnectionStatus[]> => {
    const { data } = await apiClient.get<ApiResponse<ConnectionStatus[]>>(
      '/settings/status',
    );
    return data.data;
  },

  getByCategory: async (category: string): Promise<SettingItem[]> => {
    const { data } = await apiClient.get<ApiResponse<SettingItem[]>>(
      `/settings/${category}`,
    );
    return data.data;
  },

  updateByCategory: async (
    category: string,
    settings: Array<{ key: string; value: string; isEncrypted?: boolean }>,
  ): Promise<void> => {
    await apiClient.put(`/settings/${category}`, { settings });
  },

  testConnection: async (
    category: string,
    config: Record<string, any>,
  ): Promise<TestConnectionResult> => {
    const { data } = await apiClient.post<ApiResponse<TestConnectionResult>>(
      '/settings/test-connection',
      { category, ...config },
    );
    return data.data;
  },
};
