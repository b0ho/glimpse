/**
 * Welcome 화면 컴포넌트
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { shadowStyles } from '@/utils/shadowStyles';
import { QuickDevUser } from '@/types/auth.types';
import { isDevelopment } from '@/config/dev.config';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useKakaoAuthService } from '@/services/auth/kakao-service';

interface WelcomeScreenProps {
  onSignInMode: () => void;
  onSignUpMode: () => void;
  onGoogleLogin: () => Promise<void>;
  onKakaoLogin?: (token: string, profile: any) => Promise<void>;
  onQuickDevLogin: (user: QuickDevUser) => void;
  onResetOnboarding?: () => Promise<void>;
  isGoogleLoading: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSignInMode,
  onSignUpMode,
  onGoogleLogin,
  onKakaoLogin,
  onQuickDevLogin,
  onResetOnboarding,
  isGoogleLoading,
}) => {
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation('auth');
  const [isKakaoLoading, setIsKakaoLoading] = useState(false);
  const kakaoAuthService = useKakaoAuthService();

  /**
   * 카카오 로그인 핸들러
   */
  const handleKakaoLogin = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(t('common:status.info'), t('auth:welcome.kakaoWebNotSupported'));
      return;
    }

    setIsKakaoLoading(true);
    try {
      const result = await kakaoAuthService.signInWithKakao();
      if (result.success && result.data) {
        console.log('✅ 카카오 로그인 성공:', result.data.profile);
        if (onKakaoLogin) {
          await onKakaoLogin(result.data.token.accessToken, result.data.profile);
        }
      } else {
        if (result.error && !result.error.includes('취소')) {
          Alert.alert(t('common:status.error'), result.error);
        }
      }
    } catch (error) {
      console.error('카카오 로그인 오류:', error);
      Alert.alert(t('common:status.error'), t('auth:welcome.kakaoLoginFailed'));
    } finally {
      setIsKakaoLoading(false);
    }
  };
  
  /**
   * 빠른 개발 로그인 사용자 목록
   */
  const quickDevUsers: QuickDevUser[] = [
    {
      id: 'user1',
      nickname: '김철수',
      profileImageUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
      isPremium: false,
    },
    {
      id: 'user2',
      nickname: '이영희',
      profileImageUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
      isPremium: true,
    },
    {
      id: 'user3',
      nickname: '박민수',
      profileImageUrl: 'https://randomuser.me/api/portraits/men/3.jpg',
      isPremium: false,
    },
    {
      id: 'user4',
      nickname: '최지연',
      profileImageUrl: 'https://randomuser.me/api/portraits/women/4.jpg',
      isPremium: true,
    },
  ];
  
  return (
    <View className="flex-1 justify-center items-center px-8 bg-white dark:bg-gray-900">
      {/* 로고 및 타이틀 섹션 */}
      <View className="items-center mb-12">
        <Text className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
          🌟 {t('welcome.title')}
        </Text>
        <Text className="text-base text-center text-gray-600 dark:text-gray-400">
          {t('welcome.subtitle')}
        </Text>
      </View>

      {/* 인증 버튼 컨테이너 */}
      <View className="w-full max-w-md gap-y-3">
        {/* 구글 로그인 버튼 */}
        <TouchableOpacity
          className="w-full bg-white dark:bg-gray-800 py-4 px-6 rounded-xl flex-row items-center justify-center gap-x-3 border border-gray-300 dark:border-gray-700"
          onPress={onGoogleLogin}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <ActivityIndicator size="small" color="#4285F4" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="google"
                size={20}
                color="#4285F4"
              />
              <Text className="text-base font-medium text-gray-900 dark:text-white">
                {t('welcome.continueWithGoogle')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* 카카오 로그인 버튼 */}
        {Platform.OS !== 'web' && (
          <TouchableOpacity
            className="w-full bg-yellow-400 py-4 px-6 rounded-xl flex-row items-center justify-center gap-x-3"
            onPress={handleKakaoLogin}
            disabled={isKakaoLoading}
          >
            {isKakaoLoading ? (
              <ActivityIndicator size="small" color="#3C1E1E" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="chat"
                  size={20}
                  color="#3C1E1E"
                />
                <Text className="text-base font-semibold text-yellow-900">
                  {t('welcome.continueWithKakao')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* 전화번호 로그인 버튼 */}
        <TouchableOpacity
          className="w-full bg-red-500 py-4 px-6 rounded-xl flex-row items-center justify-center gap-x-3"
          onPress={onSignInMode}
        >
          <MaterialCommunityIcons
            name="phone"
            size={20}
            color="#fff"
          />
          <Text className="text-base font-semibold text-white">
            {t('welcome.loginWithPhone')}
          </Text>
        </TouchableOpacity>

        {/* 회원가입 버튼 */}
        <TouchableOpacity
          className="w-full bg-white dark:bg-gray-800 py-4 px-6 rounded-xl flex-row items-center justify-center gap-x-3 border border-gray-300 dark:border-gray-700"
          onPress={onSignUpMode}
        >
          <MaterialCommunityIcons
            name="account-plus"
            size={20}
            color={colors.TEXT.PRIMARY}
          />
          <Text className="text-base font-medium text-gray-900 dark:text-white">
            {t('welcome.signUpWithPhone')}
          </Text>
        </TouchableOpacity>

        {/* 또는 구분선 */}
        <View className="flex-row items-center my-2">
          <View className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
          <Text className="px-4 text-sm text-gray-500 dark:text-gray-400">
            또는
          </Text>
          <View className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
        </View>

        {/* SMS 빠른 시작 버튼 */}
        <TouchableOpacity
          className="w-full bg-green-500 py-4 px-6 rounded-xl flex-row items-center justify-center gap-x-3"
          onPress={onSignUpMode}
        >
          <MaterialCommunityIcons
            name="message-text"
            size={20}
            color="#fff"
          />
          <Text className="text-base font-semibold text-white">
            SMS로 빠른 시작
          </Text>
        </TouchableOpacity>
      </View>

      {/* 개발 환경 빠른 로그인 */}
      {__DEV__ && isDevelopment && (
        <View className="w-full max-w-md mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <Text className="text-base font-semibold text-yellow-900 dark:text-yellow-100 mb-3">
            🔧 개발 환경 빠른 로그인
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {quickDevUsers.map((user) => (
              <TouchableOpacity
                key={user.id}
                className="flex-row items-center bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700"
                onPress={() => onQuickDevLogin(user)}
              >
                <Text className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.nickname}
                </Text>
                {user.isPremium && (
                  <Text className="ml-1 text-yellow-500">
                    ⭐
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* 온보딩 초기화 버튼 */}
          {onResetOnboarding && (
            <TouchableOpacity
              className="mt-3 bg-blue-500 py-2 px-4 rounded-lg"
              onPress={onResetOnboarding}
            >
              <Text className="text-sm font-medium text-white text-center">
                🔄 온보딩 초기화
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 약관 동의 문구 */}
      <View className="absolute bottom-8 px-8">
        <Text className="text-xs text-center text-gray-500 dark:text-gray-400">
          로그인 시 개인정보처리방침과 서비스 이용약관에 동의하게 됩니다.
        </Text>
      </View>
    </View>
  );
};

