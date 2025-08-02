import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { User, AuthState, AppMode } from '@shared/types';

/**
 * 인증 스토어 인터페이스
 * @interface AuthStore
 * @extends {AuthState}
 * @description 사용자 인증 상태 및 앱 모드 관리를 위한 Zustand 스토어 인터페이스
 */
interface AuthStore extends AuthState {
  // State
  /** 현재 앱 모드 (데이팅/친구) */
  currentMode: AppMode;
  
  // Actions
  /** 사용자 정보 설정 */
  setUser: (user: User | null) => void;
  /** 인증 토큰 설정 */
  setToken: (token: string | null) => void;
  /** 로딩 상태 설정 */
  setLoading: (isLoading: boolean) => void;
  /** 에러 메시지 설정 */
  setError: (error: string | null) => void;
  /** 인증 정보 초기화 */
  clearAuth: () => void;
  /** 사용자 정보 부분 업데이트 */
  updateUser: (updates: Partial<User>) => void;
  /** 사용자 프로필 업데이트 */
  updateUserProfile: (updates: Partial<User>) => void;
  /** 앱 모드 설정 */
  setAppMode: (mode: AppMode) => void;
  /** 앱 모드 토글 */
  toggleAppMode: () => void;
}

/**
 * SecureStore를 위한 커스텀 스토리지 어댑터
 * @constant secureStorage
 * @description Expo SecureStore를 Zustand persist 미들웨어와 호환되도록 래핑
 */
const secureStorage = {
  /**
   * 안전한 저장소에서 값 가져오기
   * @async
   * @param {string} name - 저장소 키
   * @returns {Promise<string | null>} 저장된 값 또는 null
   */
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return null;
    }
  },
  /**
   * 안전한 저장소에 값 저장
   * @async
   * @param {string} name - 저장소 키
   * @param {string} value - 저장할 값
   * @returns {Promise<void>}
   */
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  },
  /**
   * 안전한 저장소에서 값 제거
   * @async
   * @param {string} name - 저장소 키
   * @returns {Promise<void>}
   */
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
  },
};

/**
 * 인증 상태 관리 스토어
 * @constant useAuthStore
 * @description 사용자 인증, 프로필, 앱 모드를 관리하는 Zustand 스토어
 * @example
 * ```typescript
 * const { user, setUser, clearAuth } = useAuthStore();
 * ```
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      /** 인증 여부 */
      isAuthenticated: false,
      /** 현재 로그인한 사용자 정보 */
      user: null,
      /** JWT 인증 토큰 */
      token: null,
      /** 로딩 상태 */
      isLoading: false,
      /** 에러 메시지 */
      error: null,
      /** 현재 앱 모드 (기본값: 데이팅) */
      currentMode: AppMode.DATING,

      // Actions
      /**
       * 사용자 정보 설정
       * @param {User | null} user - 사용자 정보
       */
      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        });
      },

      /**
       * 인증 토큰 설정
       * @param {string | null} token - JWT 토큰
       */
      setToken: (token: string | null) => {
        set({ token });
      },

      /**
       * 로딩 상태 설정
       * @param {boolean} isLoading - 로딩 여부
       */
      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      /**
       * 에러 메시지 설정
       * @param {string | null} error - 에러 메시지
       */
      setError: (error: string | null) => {
        set({ error });
      },

      /**
       * 인증 정보 초기화 (로그아웃)
       * @description 모든 인증 관련 상태를 초기값으로 리셋
       */
      clearAuth: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          error: null,
          isLoading: false,
        });
      },

      /**
       * 사용자 정보 부분 업데이트
       * @param {Partial<User>} updates - 업데이트할 사용자 정보
       * @description 기존 사용자 정보를 유지하면서 특정 필드만 업데이트
       */
      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          });
        }
      },
      
      /**
       * 사용자 프로필 업데이트
       * @param {Partial<User>} updates - 업데이트할 프로필 정보
       * @description updateUser와 동일한 기능 (호환성을 위해 유지)
       */
      updateUserProfile: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          });
        }
      },
      
      /**
       * 앱 모드 설정
       * @param {AppMode} mode - 설정할 앱 모드 (DATING/FRIENDSHIP)
       * @description 앱 모드를 변경하고 사용자 정보에도 반영
       */
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
      
      /**
       * 앱 모드 토글
       * @description 데이팅 모드와 친구 모드를 전환
       */
      toggleAppMode: () => {
        const currentMode = get().currentMode;
        const newMode = currentMode === AppMode.DATING ? AppMode.FRIENDSHIP : AppMode.DATING;
        get().setAppMode(newMode);
      },
    }),
    {
      /** 저장소 키 이름 */
      name: 'auth-storage',
      /** SecureStore를 사용하는 커스텀 저장소 */
      storage: createJSONStorage(() => secureStorage),
      /**
       * 영속화할 상태 선택
       * @description 토큰, 인증 상태, 앱 모드만 안전하게 저장
       */
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        currentMode: state.currentMode,
      }),
    }
  )
);