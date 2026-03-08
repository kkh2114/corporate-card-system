import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Tokens } from '../types/models.types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, tokens: Tokens) => void;
  clearAuth: () => void;
  updateToken: (accessToken: string) => void;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  setAuth: (user, tokens) => {
    AsyncStorage.setItem('accessToken', tokens.accessToken);
    AsyncStorage.setItem('refreshToken', tokens.refreshToken);
    AsyncStorage.setItem('user', JSON.stringify(user));
    set({
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
    });
  },

  clearAuth: () => {
    AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  updateToken: (accessToken) => {
    AsyncStorage.setItem('accessToken', accessToken);
    set({ accessToken });
  },

  loadFromStorage: async () => {
    const [accessToken, refreshToken, userStr] = await AsyncStorage.multiGet([
      'accessToken',
      'refreshToken',
      'user',
    ]);
    if (accessToken[1] && refreshToken[1] && userStr[1]) {
      set({
        accessToken: accessToken[1],
        refreshToken: refreshToken[1],
        user: JSON.parse(userStr[1]),
        isAuthenticated: true,
      });
    }
  },
}));
