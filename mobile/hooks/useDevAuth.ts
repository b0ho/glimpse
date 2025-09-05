/**
 * 개발 환경 인증 우회 훅
 * @module hooks/useDevAuth
 * @description 개발 환경에서 Clerk 인증을 우회하기 위한 커스텀 훅
 */

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/slices/authSlice';
import { getCurrentSuperAccount, DEV_CONFIG, isAuthBypassEnabled } from '@/config/dev.config';
import { setAuthToken } from '@/services/api/config';
import apiClient from '@/services/api/config';
import { useAuthHydration } from '@/hooks/useAuthHydration';

/**
 * 개발 환경 인증 우회 훅
 * @returns {Object} Clerk useAuth와 호환되는 인터페이스
 */
export function useDevAuth() {
  const { setUser, setToken, user, token, isAuthenticated } = useAuthStore();
  const hasHydrated = useAuthHydration();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  
  const superAccount = getCurrentSuperAccount();

  useEffect(() => {
    // Hydration이 완료되기 전에는 아무것도 하지 않음
    if (!hasHydrated) {
      console.log('[DevAuth] Waiting for hydration...');
      return;
    }
    
    console.log('[DevAuth] Hydration complete. Auth state:', { isAuthenticated, user: !!user, token: !!token });
    
    // 이미 인증되어 있으면 해당 상태 사용
    if (isAuthenticated && user) {
      console.log('[DevAuth] User already authenticated, using existing session');
      setIsSignedIn(true);
      setIsLoaded(true);
      // 토큰이 있으면 API 클라이언트에 설정
      if (token) {
        setAuthToken(token);
      }
      return;
    }
    
    // 개발 환경에서 자동 로그인
    const loadUserFromAPI = async () => {
      if (isAuthBypassEnabled && superAccount && !user) {
        console.log('[DevAuth] Logging in with super account:', superAccount.nickname);
        
        // API 클라이언트에 토큰 설정
        setAuthToken(DEV_CONFIG.devToken);
        
        try {
          // API에서 실제 사용자 정보 가져오기
          const response = await apiClient.get<{ success: boolean; data: any }>('/users/profile');
          if (response.success && response.data) {
            // API에서 받은 데이터로 superAccount 업데이트
            const updatedUser = {
              ...superAccount,
              nickname: response.data.nickname,
              bio: response.data.bio,
              profileImage: response.data.profileImage,
              isPremium: response.data.isPremium,
              credits: response.data.credits,
            };
            setUser(updatedUser);
            setIsSignedIn(true);
          } else {
            // API 실패 시 기본 superAccount 사용
            setUser(superAccount);
            setIsSignedIn(true);
          }
        } catch (error) {
          console.error('[DevAuth] Failed to fetch user profile:', error);
          // 에러 시 기본 superAccount 사용
          setUser(superAccount);
          setIsSignedIn(true);
        }
        
        setToken(DEV_CONFIG.devToken);
        setIsLoaded(true);
      } else if (!isAuthBypassEnabled) {
        console.warn('[DevAuth] Auth bypass is disabled');
        setIsLoaded(true);
      }
    };
    
    loadUserFromAPI();
  }, [setUser, setToken, user, superAccount, hasHydrated, isAuthenticated, token]);

  return {
    isLoaded: hasHydrated && isLoaded,
    isSignedIn: hasHydrated ? (isAuthenticated && !!user) : false,
    isAuthenticated: hasHydrated ? (isAuthenticated && !!user) : false,
    user: user || superAccount,
    userId: (user || superAccount)?.id || null,
    sessionId: DEV_CONFIG.devSessionId,
    signOut: async () => {
      console.log('[DevAuth] Signing out');
      setIsSignedIn(false);
      useAuthStore.getState().clearAuth();
      setAuthToken(null);
    },
    // 개발 모드 전용 메서드
    switchAccount: (accountType: string) => {
      if (!isAuthBypassEnabled) return;
      
      // process.env.EXPO_PUBLIC_DEV_ACCOUNT_TYPE = accountType;
      // 앱 새로고침이 필요함
      console.log('[DevAuth] Switching to account:', accountType);
      console.log('[DevAuth] Please reload the app to apply changes');
    },
  };
}

// useAuth 훅은 hooks/useAuth.ts에서 통합 관리
// 이 파일은 개발 환경 \uc804용 useDevAuth만 제공