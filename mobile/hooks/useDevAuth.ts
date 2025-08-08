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

/**
 * 개발 환경 인증 우회 훅
 * @returns {Object} Clerk useAuth와 호환되는 인터페이스
 */
export function useDevAuth() {
  const { setUser, setToken, user } = useAuthStore();
  const [isLoaded, setIsLoaded] = useState(false);
  
  const superAccount = getCurrentSuperAccount();

  useEffect(() => {
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
          } else {
            // API 실패 시 기본 superAccount 사용
            setUser(superAccount);
          }
        } catch (error) {
          console.error('[DevAuth] Failed to fetch user profile:', error);
          // 에러 시 기본 superAccount 사용
          setUser(superAccount);
        }
        
        setToken(DEV_CONFIG.devToken);
        setIsLoaded(true);
      } else if (!isAuthBypassEnabled) {
        console.warn('[DevAuth] Auth bypass is disabled');
        setIsLoaded(true);
      }
    };
    
    loadUserFromAPI();
  }, [setUser, setToken, user, superAccount]);

  return {
    isLoaded,
    isSignedIn: !!superAccount,
    user: superAccount,
    userId: superAccount?.id || null,
    sessionId: DEV_CONFIG.devSessionId,
    signOut: async () => {
      console.log('[DevAuth] Signing out');
      useAuthStore.getState().clearAuth();
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

/**
 * Clerk useAuth를 대체하는 훅
 * @description 개발 환경에서는 useDevAuth, 프로덕션에서는 실제 Clerk 사용
 */
export function useAuth() {
  if (isAuthBypassEnabled) {
    return useDevAuth();
  }
  
  // 프로덕션에서는 실제 Clerk 사용
  try {
    const { useAuth: useClerkAuth } = require('@clerk/clerk-expo');
    return useClerkAuth();
  } catch (error) {
    console.error('[Auth] Failed to load Clerk:', error);
    // Clerk가 없는 경우에도 개발 모드로 폴백
    return useDevAuth();
  }
}