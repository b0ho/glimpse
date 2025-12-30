/**
 * Clerk OAuth Hook
 *
 * @module hooks/useClerkOAuth
 * @description Clerk OAuth 인증 플로우를 관리하며, 개발 환경에서 발생하는 localhost 관련 문제를 해결합니다.
 * 웹 환경에서는 OAuth 완료 후 돌아올 URL을 세션에 저장하고, Cloudflare 보호로 인한 401 오류를 처리합니다.
 */

import { useOAuth as useClerkOAuth } from '@clerk/clerk-expo';
import { Platform } from 'react-native';
import { useCallback } from 'react';

/**
 * Clerk OAuth 커스텀 훅
 *
 * @hook
 * @returns {Object} OAuth 관련 함수들
 * @returns {Function} returns.startOAuthFlow - Google OAuth 플로우를 시작하는 함수
 *
 * @description
 * Clerk OAuth 인증 플로우를 관리하는 훅입니다.
 * - 개발 환경 localhost 문제 해결
 * - 웹 환경 OAuth 리다이렉트 URL 관리
 * - Cloudflare 보호 401 오류 처리
 * - 세션 활성화 자동 처리
 *
 * @throws {Error} OAuth 플로우 실패 시 에러 발생
 *
 * @example
 * ```tsx
 * const { startOAuthFlow } = useOAuth();
 *
 * const handleLogin = async () => {
 *   try {
 *     const result = await startOAuthFlow();
 *     if (result?.createdSessionId) {
 *       // 로그인 성공
 *     }
 *   } catch (error) {
 *     // 에러 처리
 *   }
 * };
 * ```
 */
export const useOAuth = () => {
  // Get the base OAuth hook from Clerk
  const { startOAuthFlow: clerkStartOAuthFlow } = useClerkOAuth({
    strategy: 'oauth_google',
  });

  /**
   * 향상된 OAuth 플로우 핸들러
   *
   * @async
   * @returns {Promise<Object>} OAuth 결과 객체
   * @returns {string} returns.createdSessionId - 생성된 세션 ID
   * @returns {Object} returns.signIn - 로그인 정보
   * @returns {Object} returns.signUp - 회원가입 정보
   * @returns {Function} returns.setActive - 세션 활성화 함수
   *
   * @description
   * 개발 환경 문제를 처리하는 OAuth 플로우입니다.
   * - 웹 환경: 리턴 URL 저장 및 복원
   * - 세션 자동 활성화
   * - Cloudflare 오류 감지 및 안내
   *
   * @throws {Error} OAuth 플로우 실패 또는 네트워크 오류
   */
  const startOAuthFlow = useCallback(async () => {
    try {
      console.log('🚀 Starting enhanced OAuth flow');
      
      // For web platform, we need to handle the redirect URL properly
      if (Platform.OS === 'web') {
        // Store the current URL to return to after OAuth
        const returnUrl = window.location.href;
        sessionStorage.setItem('oauth_return_url', returnUrl);
        
        console.log('📍 Stored return URL:', returnUrl);
      }
      
      // Start the Clerk OAuth flow
      const result = await clerkStartOAuthFlow();
      
      // Log the result for debugging
      console.log('📊 Clerk OAuth result:', {
        hasSessionId: !!result?.createdSessionId,
        hasSignIn: !!result?.signIn,
        hasSignUp: !!result?.signUp,
        hasSetActive: !!result?.setActive,
      });
      
      // Handle the OAuth result
      if (result?.createdSessionId) {
        console.log('✅ Session created successfully');
        
        // If we have a session, ensure it's activated
        if (result.setActive) {
          try {
            await result.setActive({ session: result.createdSessionId });
            console.log('✅ Session activated');
          } catch (error) {
            console.error('❌ Failed to activate session:', error);
          }
        }
      } else if (result?.signIn || result?.signUp) {
        // Sometimes the session isn't immediately created but we have sign in/up data
        console.log('⚠️ Have auth data but no session ID yet');
        
        // Try to get the session from the sign in/up object
        const authObject = result.signIn || result.signUp;
        if (authObject?.createdSessionId) {
          console.log('📝 Found session ID in auth object');
          result.createdSessionId = authObject.createdSessionId;
        }
      }
      
      return result;
    } catch (error) {
      console.error('❌ OAuth flow error:', error);
      
      // Check if it's a Cloudflare/CORS issue
      if (error?.message?.includes('401') || error?.message?.includes('Cloudflare')) {
        console.error('🔒 Cloudflare protection detected. This is a known issue with Clerk development instances.');
        console.log('💡 Possible solutions:');
        console.log('1. Configure OAuth redirect URLs in Clerk Dashboard');
        console.log('2. Use a production Clerk instance');
        console.log('3. Use ngrok or similar tunneling service');
      }
      
      throw error;
    }
  }, [clerkStartOAuthFlow]);

  return {
    startOAuthFlow,
  };
};