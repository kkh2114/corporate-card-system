import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageService = {
  get: async (key: string): Promise<string | null> => {
    return AsyncStorage.getItem(key);
  },

  set: async (key: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(key, value);
  },

  remove: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
  },

  getObject: async <T>(key: string): Promise<T | null> => {
    const value = await AsyncStorage.getItem(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  },

  setObject: async <T>(key: string, value: T): Promise<void> => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  clear: async (): Promise<void> => {
    await AsyncStorage.clear();
  },
};
