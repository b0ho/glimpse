/**
 * Naver Authentication Hook
 *
 * @module hooks/auth/useNaverAuth
 * @description Naver OAuth 인증을 처리하는 커스텀 훅입니다.
 */

import { useState, useCallback } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

// 웹 브라우저 세션 핸들링
WebBrowser.maybeCompleteAuthSession();

// Naver OAuth 설정
const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET || '';

// Naver OAuth 엔드포인트
const discovery = {
  authorizationEndpoint: 'https://nid.naver.com/oauth2.0/authorize',
  tokenEndpoint: 'https://nid.naver.com/oauth2.0/token',
};

/**
 * 네이버 인증 훅
 *
 * @hook
 * @param {Function} onAuthCompleted - 인증 완료 콜백 함수
 * @returns {Object} Naver 인증 관련 상태 및 함수들
 */
export const useNaverAuth = (onAuthCompleted: () => void) => {
  const [isNaverLoading, setIsNaverLoading] = useState(false);
  const { signInWithOAuth } = useAuth();
  const { t } = useAndroidSafeTranslation('auth');

  // Redirect URI 생성
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'glimpse',
    path: 'auth/naver/callback',
  });

  /**
   * 네이버 로그인 핸들러
   */
  const handleNaverLogin = useCallback(async (): Promise<void> => {
    console.log('🟢 Naver login button clicked');

    // 클라이언트 ID 체크
    if (!NAVER_CLIENT_ID) {
      Alert.alert(
        t('common:status.error'),
        'Naver 클라이언트 ID가 설정되지 않았습니다.'
      );
      return;
    }

    setIsNaverLoading(true);

    try {
      // State 생성 (CSRF 방지)
      const state = Math.random().toString(36).substring(7);

      // Authorization URL 생성
      const authUrl = `${discovery.authorizationEndpoint}?` +
        `response_type=code` +
        `&client_id=${NAVER_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${state}`;

      console.log('🔗 Naver OAuth URL:', authUrl);

      // 웹 브라우저에서 인증 페이지 열기
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success' && result.url) {
        // URL에서 code와 state 추출
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');

        // State 검증
        if (returnedState !== state) {
          throw new Error('State mismatch - 보안 검증 실패');
        }

        if (code) {
          console.log('✅ Naver authorization code 획득');

          // Access Token 교환
          const tokenResponse = await fetch(discovery.tokenEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              client_id: NAVER_CLIENT_ID,
              client_secret: NAVER_CLIENT_SECRET,
              code: code,
              state: state,
            }).toString(),
          });

          const tokenData = await tokenResponse.json();

          if (tokenData.access_token) {
            console.log('✅ Naver access token 획득');

            // 백엔드에 Naver 토큰 전달
            const authResult = await signInWithOAuth('naver', tokenData.access_token);

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
          } else {
            throw new Error(tokenData.error_description || '토큰 교환 실패');
          }
        }
      } else if (result.type === 'cancel') {
        console.log('❌ Naver OAuth 취소됨');
      } else {
        Alert.alert(
          t('alerts.loginFailure.title'),
          t('alerts.loginFailure.messageOauth'),
          [{ text: t('alerts.loginFailure.confirm') }]
        );
      }
    } catch (error: any) {
      console.error('🔥 네이버 로그인 예외:', error);

      Alert.alert(
        t('alerts.loginFailure.messageGeneral'),
        error.message || t('alerts.loginFailure.messageGeneralDescription')
      );
    } finally {
      setIsNaverLoading(false);
    }
  }, [signInWithOAuth, onAuthCompleted, t, redirectUri]);

  return {
    isNaverLoading,
    handleNaverLogin,
  };
};

export default useNaverAuth;

