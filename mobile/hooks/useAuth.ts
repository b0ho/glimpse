/**
 * 통합 인증 훅
 * @module hooks/useAuth
 * @description 환경에 따라 Clerk 또는 개발 인증 사용
 */

import { isAuthBypassEnabled } from '@/config/dev.config';

/**
 * 환경에 따른 인증 훅
 * @returns {Object} Clerk useAuth 인터페이스
 * @description 개발 환경에서는 useDevAuth, 운영에서는 Clerk 사용
 */
export function useAuth() {
  // 개발 환경 체크
  if (__DEV__ && isAuthBypassEnabled) {
    // 개발 환경에서는 useDevAuth 사용
    const { useDevAuth } = require('./useDevAuth');
    return useDevAuth();
  }
  
  // 운영 환경에서는 실제 Clerk 사용
  try {
    const { useAuth: useClerkAuth } = require('@clerk/clerk-expo');
    const clerkAuth = useClerkAuth();
    
    // Clerk signOut 래퍼 추가 - 완전한 로그아웃 보장
    return {
      ...clerkAuth,
      signOut: async () => {
        try {
          // Clerk 로그아웃 실행
          await clerkAuth.signOut();
          
          // 운영 환경에서는 추가로 세션 정리
          if (typeof window !== 'undefined' && !__DEV__) {
            // 웹 환경에서 로컬 스토리지 정리
            localStorage.clear();
            sessionStorage.clear();
            
            // 약간의 지연 후 페이지 새로고침으로 완전한 세션 종료
            setTimeout(() => {
              window.location.href = '/';
            }, 100);
          }
        } catch (error) {
          console.error('[Clerk] Sign out error:', error);
          throw error;
        }
      }
    };
  } catch (error) {
    console.error('[Auth] Failed to load Clerk:', error);
    
    // Clerk 로드 실패 시 개발 모드로 폴백
    if (__DEV__) {
      const { useDevAuth } = require('./useDevAuth');
      return useDevAuth();
    }
    
    // 운영 환경에서 Clerk 로드 실패는 치명적 오류
    throw new Error('Failed to initialize authentication');
  }
}