import axios from 'axios';
import { Config } from '../constants/config';
import { useAuthStore } from '../store/authStore';

const apiClient = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: Config.REQUEST_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
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
      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().clearAuth();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${Config.API_BASE_URL}/auth/refresh`,
          null,
          { headers: { Authorization: `Bearer ${refreshToken}` } },
        );
        const { accessToken } = response.data.data;
        useAuthStore.getState().updateToken(accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch {
        useAuthStore.getState().clearAuth();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
