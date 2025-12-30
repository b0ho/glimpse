/**
 * Google Authentication Hook
 *
 * @module hooks/auth/useGoogleAuth
 * @description Google OAuth 인증을 처리하는 커스텀 훅입니다.
 * 자체 JWT 인증 시스템을 사용합니다.
 */

import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useAuthStore } from '@/store/slices/authSlice';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { OAuthUserInfo } from '@/types/auth.types';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// 웹 브라우저 세션 핸들링
WebBrowser.maybeCompleteAuthSession();

/**
 * 구글 인증 훅
 *
 * @hook
 * @param {Function} onAuthCompleted - 인증 완료 콜백 함수
 * @returns {Object} Google 인증 관련 상태 및 함수들
 */
export const useGoogleAuth = (onAuthCompleted: () => void) => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signInWithOAuth } = useAuth();
  const { setUser } = useAuthStore();
  const { t } = useAndroidSafeTranslation('auth');
  
  // Google OAuth 설정
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });
  
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
  const createUserFromOAuth = (userInfo: OAuthUserInfo, userId: string) => {
    return {
      id: userInfo.id || userId,
      email: userInfo.email || '',
      nickname: userInfo.nickname || 
                `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || 
                t('fallbackUser.googleUser'),
      anonymousId: `anon_${userInfo.id || userId}`,
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
    console.log('🟡 Google login button clicked');
    
    // 개발 환경에서는 OAuth 우회
    if (__DEV__) {
      console.log('🔧 개발 모드 감지 - OAuth 우회하고 프리미엄 계정으로 직접 로그인');
      return handleQuickDevLogin(true);
    }
    
    setIsGoogleLoading(true);
    
    try {
      // Google OAuth 플로우 시작
      const result = await promptAsync();
      
      if (result.type === 'success' && result.authentication?.accessToken) {
        console.log('✅ Google OAuth 성공');
        
        // 백엔드에 Google 토큰 전달
        const authResult = await signInWithOAuth('google', result.authentication.accessToken);
        
        if (authResult.success && authResult.userId) {
          console.log('✅ 백엔드 인증 성공:', authResult.userId);
          
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
        } else {
          Alert.alert(
            t('alerts.loginFailure.title'), 
            authResult.error || t('alerts.loginFailure.messageOauth'),
            [{ text: t('alerts.loginFailure.confirm') }]
          );
        }
      } else if (result.type === 'cancel') {
        console.log('❌ Google OAuth 취소됨');
      } else {
        Alert.alert(
          t('alerts.loginFailure.title'), 
          t('alerts.loginFailure.messageOauth'),
          [{ text: t('alerts.loginFailure.confirm') }]
        );
      }
    } catch (error: any) {
      console.error('🔥 구글 로그인 예외:', error);
      
      Alert.alert(
        t('alerts.loginFailure.messageGeneral'), 
        error.message || t('alerts.loginFailure.messageGeneralDescription')
      );
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
