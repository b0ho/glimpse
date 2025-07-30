import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { User, AuthState, AppMode } from '@shared/types';

interface AuthStore extends AuthState {
  // State
  currentMode: AppMode;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  updateUser: (updates: Partial<User>) => void;
  setAppMode: (mode: AppMode) => void;
  toggleAppMode: () => void;
}

// SecureStore를 위한 커스텀 스토리지
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
  },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
      error: null,
      currentMode: AppMode.DATING,

      // Actions
      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        });
      },

      setToken: (token: string | null) => {
        set({ token });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearAuth: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          error: null,
          isLoading: false,
        });
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          });
        }
      },
      
      setAppMode: (mode: AppMode) => {
        set({ currentMode: mode });
        // Update user's current mode in the backend
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, currentMode: mode },
          });
        }
      },
      
      toggleAppMode: () => {
        const currentMode = get().currentMode;
        const newMode = currentMode === AppMode.DATING ? AppMode.FRIENDSHIP : AppMode.DATING;
        get().setAppMode(newMode);
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      // 토큰과 모드 정보 persist
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        currentMode: state.currentMode,
      }),
    }
  )
);