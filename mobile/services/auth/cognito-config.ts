/**
 * AWS Cognito 설정
 * 
 * Amplify Gen 2 방식으로 Cognito User Pool을 설정합니다.
 * 
 * @module services/auth/cognito-config
 */

import { Amplify } from 'aws-amplify';

/**
 * Cognito 설정 타입
 */
export interface CognitoConfig {
  userPoolId: string;
  userPoolClientId: string;
  region: string;
  signUpVerificationMethod?: 'code' | 'link';
}

/**
 * 환경 변수에서 Cognito 설정 가져오기
 */
const getCognitoConfig = (): CognitoConfig => {
  const config: CognitoConfig = {
    userPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID || '',
    userPoolClientId: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID || '',
    region: process.env.EXPO_PUBLIC_AWS_REGION || 'ap-northeast-2',
    signUpVerificationMethod: 'code',
  };

  // 개발 모드에서 설정 검증
  if (__DEV__) {
    console.log('[Cognito Config] User Pool ID:', config.userPoolId ? '✓ 설정됨' : '✗ 미설정');
    console.log('[Cognito Config] Client ID:', config.userPoolClientId ? '✓ 설정됨' : '✗ 미설정');
    console.log('[Cognito Config] Region:', config.region);
  }

  return config;
};

/**
 * AWS Amplify Cognito 설정
 * 
 * App.tsx에서 초기화 시 한 번만 호출합니다.
 */
export const configureCognito = (): void => {
  const config = getCognitoConfig();

  if (!config.userPoolId || !config.userPoolClientId) {
    console.warn('[Cognito Config] Cognito 환경 변수가 설정되지 않았습니다. Cognito 기능이 비활성화됩니다.');
    return;
  }

  try {
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: config.userPoolId,
          userPoolClientId: config.userPoolClientId,
          signUpVerificationMethod: config.signUpVerificationMethod,
          loginWith: {
            phone: true, // 전화번호 로그인 활성화
          },
        },
      },
    });

    console.log('[Cognito Config] AWS Amplify 초기화 완료');
  } catch (error) {
    console.error('[Cognito Config] AWS Amplify 초기화 실패:', error);
  }
};

/**
 * Cognito가 설정되었는지 확인
 */
export const isCognitoConfigured = (): boolean => {
  const config = getCognitoConfig();
  return !!(config.userPoolId && config.userPoolClientId);
};

/**
 * Cognito 설정 내보내기 (테스트용)
 */
export const cognitoConfig = getCognitoConfig();

