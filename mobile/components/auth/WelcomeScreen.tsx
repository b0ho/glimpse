/**
 * Welcome 화면 컴포넌트
 * 
 * SMS 단일 인증 방식 - 개인 특정 및 중복 방지를 위한 보안 정책
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { QuickDevUser } from '@/types/auth.types';
import { isDevelopment } from '@/config/dev.config';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface WelcomeScreenProps {
  onSignInMode: () => void;
  onSignUpMode: () => void;
  onQuickDevLogin: (user: QuickDevUser) => void;
  onResetOnboarding?: () => Promise<void>;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSignInMode,
  onSignUpMode,
  onQuickDevLogin,
  onResetOnboarding,
}) => {
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation('auth');

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
      <View className="w-full max-w-md gap-y-4">
        {/* SMS 회원가입 버튼 (메인) */}
        <TouchableOpacity
          className="w-full bg-red-500 py-4 px-6 rounded-xl flex-row items-center justify-center gap-x-3"
          onPress={onSignUpMode}
        >
          <MaterialCommunityIcons
            name="message-text"
            size={22}
            color="#fff"
          />
          <Text className="text-base font-semibold text-white">
            {t('welcome.signUpWithPhone')}
          </Text>
        </TouchableOpacity>

        {/* 구분선 */}
        <View className="flex-row items-center my-2">
          <View className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
          <Text className="px-4 text-sm text-gray-500 dark:text-gray-400">
            {t('welcome.alreadyHaveAccount')}
          </Text>
          <View className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
        </View>

        {/* SMS 로그인 버튼 */}
        <TouchableOpacity
          className="w-full bg-white dark:bg-gray-800 py-4 px-6 rounded-xl flex-row items-center justify-center gap-x-3 border border-gray-300 dark:border-gray-700"
          onPress={onSignInMode}
        >
          <MaterialCommunityIcons
            name="phone"
            size={22}
            color={colors.TEXT.PRIMARY}
          />
          <Text className="text-base font-medium text-gray-900 dark:text-white">
            {t('welcome.loginWithPhone')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 보안 안내 문구 */}
      <View className="mt-8 px-4">
        <Text className="text-xs text-center text-gray-500 dark:text-gray-400">
          🔒 전화번호 인증으로 안전하게 본인 확인
        </Text>
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
          {t('welcome.termsNotice')}
        </Text>
      </View>
    </View>
  );
};
