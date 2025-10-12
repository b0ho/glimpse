/**
 * 앱 모드 선택 화면 (NativeWind v4 버전)
 *
 * @screen
 * @description 사용자가 데이팅 모드와 친구 찾기 모드 중 하나를 선택하는 온보딩 화면
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '@/store/slices/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { AppMode } from '@/shared/types';
import { cn } from '@/lib/utils';

const { width } = Dimensions.get('window');

/**
 * 앱 모드 선택 컴포넌트
 *
 * @component
 * @returns {JSX.Element} 데이팅/친구 찾기 모드 선택 카드
 *
 * @description
 * 사용자가 앱을 처음 사용할 때 데이팅 모드 또는 친구 찾기 모드를 선택하는 온보딩 화면입니다.
 * - 데이팅 모드: 좋아요, 매칭, 익명 시스템 기반 연애 매칭
 * - 친구 찾기 모드: 커뮤니티, 그룹 채팅, 이벤트 기반 친구 찾기
 * - 각 모드별 주요 기능 설명 표시
 * - 선택 후 메인 앱으로 자동 이동 (navigation.reset)
 * - 나중에 설정에서 모드 변경 가능 안내
 * - 아이콘과 색상으로 명확한 구분
 * - 다크모드 완벽 지원
 *
 * @navigation
 * - From: 앱 최초 실행 시 자동 표시 (인증 완료 후)
 * - To: Main (모드 선택 후 reset으로 이동)
 *
 * @example
 * ```tsx
 * // 온보딩 플로우에서 자동 표시
 * if (!user.appMode) {
 *   navigation.navigate('ModeSelection');
 * }
 *
 * // 설정에서 모드 변경 시
 * navigation.push('ModeSelection');
 * ```
 *
 * @category Screen
 * @subcategory Onboarding
 */
export const ModeSelectionScreen = () => {
  const navigation = useNavigation() as any;
  const { t } = useAndroidSafeTranslation('common');
  const { setAppMode } = useAuthStore();
  const { colors, isDarkMode } = useTheme();

  const handleModeSelection = (mode: AppMode) => {
    setAppMode(mode);
    // Navigate to main app after mode selection
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <SafeAreaView 
      className="flex-1 bg-white dark:bg-gray-900"
      style={{ backgroundColor: colors.BACKGROUND }}
    >
      <View className="items-center mt-16 mb-8">
        <Text 
          className="text-4xl font-bold mb-3"
          style={{ color: colors.PRIMARY }}
        >
          {t('modeselection:app.name')}
        </Text>
        <Text 
          className="text-lg"
          style={{ color: colors.TEXT.SECONDARY }}
        >
          {t('modeselection:mode.selection.title')}
        </Text>
      </View>

      <View className="flex-1 px-6 justify-center space-y-6">
        {/* Dating Mode */}
        <TouchableOpacity
          className="rounded-2xl p-8 border-2 shadow-sm elevation-5 bg-white dark:bg-gray-800"
          style={{ 
            backgroundColor: colors.SURFACE,
            borderColor: colors.PRIMARY + '20',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          }}
          onPress={() => handleModeSelection(AppMode.DATING)}
          activeOpacity={0.8}
        >
          <View className="items-center mb-4">
            <Icon name="heart" size={60} color={colors.PRIMARY} />
          </View>
          <Text 
            className="text-2xl font-bold text-center mb-3"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            {t('modeselection:mode.selection.dating.title')}
          </Text>
          <Text 
            className="text-base text-center mb-4 leading-6"
            style={{ color: colors.TEXT.SECONDARY }}
          >
            {t('modeselection:mode.selection.dating.description')}
          </Text>
          <View className="mt-3">
            <Text 
              className="text-sm mb-1"
              style={{ color: colors.TEXT.SECONDARY }}
            >
              {t('modeselection:mode.selection.dating.features.like')}
            </Text>
            <Text 
              className="text-sm mb-1"
              style={{ color: colors.TEXT.SECONDARY }}
            >
              {t('modeselection:mode.selection.dating.features.matching')}
            </Text>
            <Text 
              className="text-sm mb-1"
              style={{ color: colors.TEXT.SECONDARY }}
            >
              {t('modeselection:mode.selection.dating.features.anonymous')}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Friendship Mode */}
        <TouchableOpacity
          className="rounded-2xl p-8 border-2 shadow-sm elevation-5 bg-white dark:bg-gray-800"
          style={{ 
            backgroundColor: colors.SURFACE,
            borderColor: '#4ECDC420',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          }}
          onPress={() => handleModeSelection(AppMode.FRIENDSHIP)}
          activeOpacity={0.8}
        >
          <View className="items-center mb-4">
            <Icon name="people" size={60} color={colors.SECONDARY || "#4ECDC4"} />
          </View>
          <Text 
            className="text-2xl font-bold text-center mb-3"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            {t('modeselection:mode.selection.friendship.title')}
          </Text>
          <Text 
            className="text-base text-center mb-4 leading-6"
            style={{ color: colors.TEXT.SECONDARY }}
          >
            {t('modeselection:mode.selection.friendship.description')}
          </Text>
          <View className="mt-3">
            <Text 
              className="text-sm mb-1"
              style={{ color: colors.TEXT.SECONDARY }}
            >
              {t('modeselection:mode.selection.friendship.features.community')}
            </Text>
            <Text 
              className="text-sm mb-1"
              style={{ color: colors.TEXT.SECONDARY }}
            >
              {t('modeselection:mode.selection.friendship.features.groupChat')}
            </Text>
            <Text 
              className="text-sm mb-1"
              style={{ color: colors.TEXT.SECONDARY }}
            >
              {t('modeselection:mode.selection.friendship.features.events')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text 
        className="text-sm text-center mb-8 px-6"
        style={{ color: colors.TEXT.MUTED }}
      >
        {t('modeselection:mode.selection.note')}
      </Text>
    </SafeAreaView>
  );
};