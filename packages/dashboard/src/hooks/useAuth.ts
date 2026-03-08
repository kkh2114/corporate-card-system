import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth.api';
import { ROUTES } from '@/constants/routes';
import type { LoginRequest } from '@/types/api.types';

export function useAuth() {
  const navigate = useNavigate();
  const { user, isAuthenticated, setUser, setTokens, logout: storeLogout } = useAuthStore();

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const response = await authApi.login(credentials);
      setTokens(response.accessToken, response.refreshToken);
      setUser(response.user);
      navigate(ROUTES.DASHBOARD);
    },
    [navigate, setUser, setTokens]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      storeLogout();
      navigate(ROUTES.LOGIN);
    }
  }, [navigate, storeLogout]);

  return { user, isAuthenticated, login, logout };
}
