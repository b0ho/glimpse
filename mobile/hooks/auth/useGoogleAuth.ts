/**
 * Google Authentication Hook
 *
 * @module hooks/auth/useGoogleAuth
 * @description Google OAuth 인증을 처리하는 커스텀 훅입니다.
 * Clerk OAuth를 사용하며, 개발 환경에서는 빠른 로그인을 지원합니다.
 */

import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useOAuth } from '@clerk/clerk-expo';
import { useAuthStore } from '@/store/slices/authSlice';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { OAuthUserInfo } from '@/types/auth.types';

/**
 * 구글 인증 훅
 *
 * @hook
 * @param {Function} onAuthCompleted - 인증 완료 콜백 함수
 * @returns {Object} Google 인증 관련 상태 및 함수들
 * @returns {boolean} returns.isGoogleLoading - 구글 로그인 진행 중 여부
 * @returns {Function} returns.handleGoogleLogin - 구글 로그인 핸들러
 * @returns {Function} returns.handleQuickDevLogin - 개발 환경 빠른 로그인 핸들러
 *
 * @description
 * Google OAuth 인증 플로우를 관리합니다.
 * - 프로덕션: Clerk OAuth 사용
 * - 개발 환경: 빠른 로그인 지원 (OAuth 우회)
 * - 네트워크 오류 처리 (Cloudflare 등)
 * - 사용자 정보 자동 매핑
 *
 * @example
 * ```tsx
 * const { isGoogleLoading, handleGoogleLogin } = useGoogleAuth(() => {
 *   console.log('인증 완료!');
 *   navigation.navigate('Home');
 * });
 *
 * // 구글 로그인 버튼
 * <Button
 *   onPress={handleGoogleLogin}
 *   loading={isGoogleLoading}
 *   title="Google로 로그인"
 * />
 * ```
 */
export const useGoogleAuth = (onAuthCompleted: () => void) => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { setUser } = useAuthStore();
  const { t } = useAndroidSafeTranslation('auth');
  
  /**
   * 개발 환경 빠른 로그인
   */
  const handleQuickDevLogin = (isPremium: boolean = false) => {
    const mockUser = {
      id: isPremium ? 'premium_user_id' : 'dev_user_id',
      nickname: isPremium ? '프리미엄 테스터' : '개발 테스터',
      email: isPremium ? 'premium@test.com' : 'dev@test.com',
      anonymousId: `anon_${isPremium ? 'premium' : 'dev'}`,
      phoneNumber: '',
      isVerified: true,
      credits: isPremium ? 999 : 5,
      isPremium,
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      currentMode: 'DATING' as any,
    };
    
    setUser(mockUser);
    onAuthCompleted();
  };
  
  /**
   * OAuth 사용자 정보를 앱 사용자 정보로 변환
   */
  const createUserFromOAuth = (userInfo: OAuthUserInfo, sessionId: string) => {
    return {
      id: userInfo.id || sessionId,
      email: userInfo.email || '',
      nickname: userInfo.nickname || 
                `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || 
                t('fallbackUser.googleUser'),
      anonymousId: `anon_${userInfo.id || sessionId}`,
      phoneNumber: '',
      isVerified: true,
      profileImageUrl: userInfo.profileImageUrl,
      credits: 0,
      isPremium: false,
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      currentMode: 'DATING' as any,
    };
  };
  
  /**
   * 구글 로그인 핸들러
   */
  const handleGoogleLogin = async (): Promise<void> => {
    console.log('🟡 Google login button clicked (Clerk OAuth)');
    
    // 개발 환경에서는 OAuth 우회
    if (__DEV__) {
      console.log('🔧 개발 모드 감지 - OAuth 우회하고 프리미엄 계정으로 직접 로그인');
      return handleQuickDevLogin(true);
    }
    
    setIsGoogleLoading(true);
    
    try {
      const result = await startOAuthFlow();
      
      if (!result) {
        console.log('❌ OAuth 플로우 취소됨');
        return;
      }
      
      const { createdSessionId, signIn, signUp, setActive } = result;
      
      if (createdSessionId && setActive) {
        console.log('✅ Clerk OAuth 로그인 성공:', createdSessionId);
        
        // 세션 활성화
        await setActive({ session: createdSessionId });
        
        // 사용자 정보 가져오기
        const userInfo = signIn || signUp;
        if (userInfo) {
          const userData = createUserFromOAuth({
            id: userInfo.id,
            email: (userInfo as any).emailAddress,
            firstName: (userInfo as any).firstName,
            lastName: (userInfo as any).lastName,
            profileImageUrl: (userInfo as any).imageUrl,
          }, createdSessionId);
          
          setUser(userData);
          
          Alert.alert(
            t('alerts.loginSuccess.title'),
            t('alerts.loginSuccess.messageWithName', { nickname: userData.nickname }),
            [
              {
                text: t('alerts.loginSuccess.confirm'),
                onPress: () => onAuthCompleted(),
              }
            ]
          );
        } else {
          // Fallback 사용자 정보
          const fallbackUser = createUserFromOAuth({}, createdSessionId);
          setUser(fallbackUser);
          
          Alert.alert(
            t('alerts.loginSuccess.title'),
            t('alerts.loginSuccess.messageDefault'),
            [
              {
                text: t('alerts.loginSuccess.confirm'),
                onPress: () => onAuthCompleted(),
              }
            ]
          );
        }
      } else {
        Alert.alert(
          t('alerts.loginFailure.title'), 
          t('alerts.loginFailure.messageOauth'),
          [{ text: t('alerts.loginFailure.confirm') }]
        );
      }
    } catch (error: any) {
      console.error('🔥 Clerk 구글 로그인 예외:', error);
      
      // 네트워크 오류 처리
      if (error.message?.includes('401') || error.message?.includes('cloudflare')) {
        console.log('🔧 Cloudflare 오류 감지, 개발 환경 fallback 적용');
        
        if (process.env.NODE_ENV === 'development') {
          const fallbackUser = createUserFromOAuth({
            nickname: t('fallbackUser.fallbackUser'),
          }, 'fallback_google_user');
          
          setUser(fallbackUser);
          
          Alert.alert(
            t('alerts.devMode.title'),
            t('alerts.devMode.message'),
            [
              {
                text: t('alerts.devMode.confirm'),
                onPress: () => onAuthCompleted(),
              }
            ]
          );
        } else {
          Alert.alert(
            t('alerts.loginFailure.messageNetwork'), 
            t('alerts.loginFailure.messageNetworkDescription')
          );
        }
      } else {
        Alert.alert(
          t('alerts.loginFailure.messageGeneral'), 
          error.message || t('alerts.loginFailure.messageGeneralDescription')
        );
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };
  
  return {
    isGoogleLoading,
    handleGoogleLogin,
    handleQuickDevLogin,
  };
};