import { useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth.api';

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (employeeId: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await authApi.login(employeeId, password);
        setAuth(data.user, {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn,
        });
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message ??
          '로그인에 실패했습니다. 다시 시도해주세요.';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setAuth],
  );

  const logout = useCallback(async () => {
    clearAuth();
  }, [clearAuth]);

  return { user, isAuthenticated, login, logout, loading, error };
}
