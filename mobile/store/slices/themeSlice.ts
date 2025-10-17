/**
 * 테마 상태 관리 스토어
 * @module store/slices/themeSlice
 * @description 다크모드/라이트모드 테마 관리를 위한 Zustand 스토어
 */

import { create, persist, createJSONStorage } from '../zustandCompat';
import { Platform, Appearance } from 'react-native';
import { ThemeStore, ThemeMode, ColorPalette } from '@/types/theme';
import { LIGHT_COLORS, DARK_COLORS } from '@/constants/theme';

// Web과 Native 환경에 따른 SecureStore 처리
let SecureStore: any;
if (Platform.OS === 'web') {
  SecureStore = {
    getItemAsync: async (key: string) => 
      typeof window !== 'undefined' && window.localStorage 
        ? window.localStorage.getItem(key) 
        : null,
    setItemAsync: async (key: string, value: string) => { 
      if (typeof window !== 'undefined' && window.localStorage) 
        window.localStorage.setItem(key, value); 
    },
    deleteItemAsync: async (key: string) => { 
      if (typeof window !== 'undefined' && window.localStorage) 
        window.localStorage.removeItem(key); 
    },
  };
} else {
  SecureStore = require('expo-secure-store');
}

/**
 * 안전한 저장소 어댑터
 */
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

/**
 * 시스템 테마 감지
 */
const getSystemTheme = (): 'light' | 'dark' => {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && 
           window.matchMedia && 
           window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' 
      : 'light';
  }
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
};

/**
 * 실제 테마 결정 (system 모드 처리)
 */
const resolveTheme = (mode: ThemeMode): 'light' | 'dark' => {
  if (mode === 'system') {
    return getSystemTheme();
  }
  return mode;
};

/**
 * 테마에 따른 색상 팔레트 반환
 */
const getColors = (isDark: boolean): ColorPalette => {
  return isDark ? DARK_COLORS : LIGHT_COLORS;
};

/**
 * 테마 스토어 구현
 */
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      mode: 'system' as ThemeMode,
      isDark: getSystemTheme() === 'dark',
      colors: getColors(getSystemTheme() === 'dark'),

      // 액션들
      setTheme: (mode: ThemeMode) => {
        const resolvedTheme = resolveTheme(mode);
        const isDark = resolvedTheme === 'dark';
        const colors = getColors(isDark);

        set({
          mode,
          isDark,
          colors,
        });

        // Web: document.documentElement에 dark 클래스 추가/제거 (NativeWind v4 필수!)
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          console.log('[Theme] Web dark mode updated:', isDark);
        }

        // 상태바 스타일 업데이트 (네이티브만)
        if (Platform.OS !== 'web') {
          try {
            const { StatusBar } = require('expo-status-bar');
            // StatusBar 스타일은 컴포넌트에서 처리
          } catch (error) {
            console.warn('StatusBar update failed:', error);
          }
        }
      },

      toggleTheme: () => {
        const { mode } = get();
        let newMode: ThemeMode;
        
        if (mode === 'light') {
          newMode = 'dark';
        } else if (mode === 'dark') {
          newMode = 'system';
        } else {
          newMode = 'light';
        }
        
        get().setTheme(newMode);
      },

      initializeTheme: async () => {
        try {
          // Zustand persist가 이미 storage에서 state를 복원했으므로
          // 현재 mode를 읽어서 setTheme()을 호출하여
          // Web 환경에서 document.classList를 업데이트
          const { mode } = get();
          console.log('[Theme] Initializing with mode:', mode);

          // setTheme() 호출해서 document.classList 업데이트
          get().setTheme(mode);

          // 시스템 테마 변경 감지 (네이티브만)
          if (Platform.OS !== 'web') {
            const subscription = Appearance.addChangeListener(({ colorScheme }) => {
              const { mode } = get();
              if (mode === 'system') {
                const isDark = colorScheme === 'dark';
                const colors = getColors(isDark);

                set({
                  isDark,
                  colors,
                });
              }
            });

            // cleanup은 앱 종료 시 자동으로 처리됨
            // Note: subscription cleanup은 별도로 관리됨
          }
        } catch (error) {
          console.error('Theme initialization error:', error);
        }
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => ({
        getItem: secureStorage.getItem,
        setItem: secureStorage.setItem,
        removeItem: secureStorage.removeItem,
      })),
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);

/**
 * 테마 셀렉터들
 */
export const themeSelectors = {
  mode: () => (state: ThemeStore) => state.mode,
  isDark: () => (state: ThemeStore) => state.isDark,
  colors: () => (state: ThemeStore) => state.colors,
  isSystem: () => (state: ThemeStore) => state.mode === 'system',
};

/**
 * 편의 함수들
 */
export const getThemeMode = () => useThemeStore.getState().mode;
export const isDarkMode = () => useThemeStore.getState().isDark;
export const getThemeColors = () => useThemeStore.getState().colors;