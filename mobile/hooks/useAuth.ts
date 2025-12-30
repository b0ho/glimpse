/**
 * 통합 인증 훅
 * @module hooks/useAuth
 * @description 자체 JWT 인증 시스템 사용
 */

import { useAuth as useAuthProvider } from '../providers/AuthProvider';

/**
 * 인증 훅
 * 
 * @returns {Object} 인증 상태 및 메서드
 * @description 자체 JWT 인증 시스템 사용
 * 
 * @example
 * ```tsx
 * const { isSignedIn, signOut, userId } = useAuth();
 * 
 * if (isSignedIn) {
 *   return <AuthenticatedView />;
 * }
 * ```
 */
export function useAuth() {
  return useAuthProvider();
}

// 레거시 호환성을 위한 re-export
export { useAuth as default };
