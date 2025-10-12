/**
 * 테마 선택 컴포넌트
 * @module components/settings/ThemeSelector
 * @description 라이트/다크/시스템 테마를 선택할 수 있는 설정 UI 컴포넌트
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';
import { ThemeMode } from '@/types/theme';
import { cn } from '@/lib/utils';

/**
 * 테마 선택 컴포넌트 Props
 */
interface ThemeSelectorProps {
  /** 테마 변경 완료 콜백 */
  onThemeChange?: (mode: ThemeMode) => void;
}

/**
 * 테마 옵션 정보
 */
interface ThemeOption {
  mode: ThemeMode;
  titleKey: string;
  descriptionKey: string;
  icon: string;
}

/**
 * 테마 선택 컴포넌트
 * @param props - 컴포넌트 props
 * @returns JSX.Element
 */
export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onThemeChange }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));
  const { t } = useAndroidSafeTranslation('settings');
  const { mode, isDark, colors, setTheme } = useTheme();

  /**
   * 테마 옵션들
   */
  const themeOptions: ThemeOption[] = [
    {
      mode: 'light',
      titleKey: 'theme.light',
      descriptionKey: 'theme.lightDescription',
      icon: 'sunny',
    },
    {
      mode: 'dark',
      titleKey: 'theme.dark',
      descriptionKey: 'theme.darkDescription',
      icon: 'moon',
    },
    {
      mode: 'system',
      titleKey: 'theme.system',
      descriptionKey: 'theme.systemDescription',
      icon: 'phone-portrait',
    },
  ];

  /**
   * 현재 테마 모드의 표시 텍스트 가져오기
   */
  const getCurrentThemeText = (currentMode: ThemeMode): string => {
    switch (currentMode) {
      case 'light':
        return t('settings:theme.light', '라이트');
      case 'dark':
        return t('settings:theme.dark', '다크');
      case 'system':
        return t('settings:theme.system', '시스템 기본값');
      default:
        return t('settings:theme.system', '시스템 기본값');
    }
  };

  /**
   * 모달 열기 애니메이션
   */
  const openModal = () => {
    setIsModalVisible(true);
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  /**
   * 모달 닫기 애니메이션
   */
  const closeModal = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 150,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsModalVisible(false);
    });
  };

  /**
   * 테마 변경 처리
   */
  const handleThemeChange = (newMode: ThemeMode) => {
    setTheme(newMode);
    onThemeChange?.(newMode);
    closeModal();

    // 변경 완료 알림
    const themeName = getCurrentThemeText(newMode);
    Alert.alert(
      t('settings:theme.changeSuccess', '테마 변경 완료'),
      t('settings:theme.changeSuccessMessage', '{{theme}} 모드로 변경되었습니다', {
        theme: themeName,
      }),
      [{ text: t('common:buttons.confirm', '확인') }]
    );
  };

  /**
   * 테마 옵션 렌더링
   */
  const renderThemeOption = (option: ThemeOption) => {
    const isSelected = mode === option.mode;

    return (
      <TouchableOpacity
        key={option.mode}
        className={cn(
          "flex-row items-center p-4 rounded-lg mb-2",
          isSelected && "bg-primary-100 dark:bg-primary-900"
        )}
        onPress={() => handleThemeChange(option.mode)}
      >
        <View className={cn(
          "w-10 h-10 rounded-full items-center justify-center mr-3",
          isSelected ? "bg-primary-500" : "bg-gray-200 dark:bg-gray-700"
        )}>
          <Ionicons
            name={option.icon as any}
            size={24}
            color={isSelected ? colors.TEXT.WHITE : colors.TEXT.PRIMARY}
          />
        </View>

        <View className="flex-1">
          <Text className={cn(
            "text-base font-medium mb-1",
            isSelected ? "text-primary-600 dark:text-primary-400" : "text-gray-900 dark:text-white"
          )}>
            {t(`settings:${option.titleKey}`, option.mode)}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {t(`settings:${option.descriptionKey}`, '')}
          </Text>
        </View>

        {isSelected && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.PRIMARY}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* 테마 설정 항목 */}
      <TouchableOpacity
        className="flex-row items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg"
        onPress={openModal}
      >
        <View className="flex-row items-center">
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={20}
            color={colors.TEXT.PRIMARY}
          />
          <Text className="ml-3 text-base text-gray-900 dark:text-white">
            {t('settings:theme.title', '테마')}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-base text-gray-700 dark:text-gray-300 mr-2">
            {getCurrentThemeText(mode)}
          </Text>
          <Text className="text-gray-400 dark:text-gray-500">{'>'}</Text>
        </View>
      </TouchableOpacity>

      {/* 테마 선택 모달 */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          className="flex-1 justify-center items-center bg-black/50"
          activeOpacity={1}
          onPress={closeModal}
        >
          <Animated.View
            className="w-4/5 max-w-md rounded-2xl p-6"
            style={{
              backgroundColor: colors.BACKGROUND,
              transform: [{ scale: scaleAnim }]
            }}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('settings:theme.selectTheme', '테마 선택')}
                </Text>
                <TouchableOpacity
                  className="p-2"
                  onPress={closeModal}
                >
                  <Ionicons name="close" size={20} color={colors.TEXT.PRIMARY} />
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                {themeOptions.map(renderThemeOption)}
              </View>

              <View className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Text className="text-sm text-center text-gray-500 dark:text-gray-400">
                  {t('settings:theme.footerNote', '시스템 기본값은 기기 설정을 따릅니다')}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};
