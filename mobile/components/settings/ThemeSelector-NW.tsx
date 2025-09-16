/**
 * 테마 선택 컴포넌트
 * @module components/settings/ThemeSelector
 * @description 라이트/다크/시스템 테마를 선택할 수 있는 설정 UI 컴포넌트
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity
  Modal,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';
import { ThemeMode } from '@/types/theme';
import { SPACING, FONT_SIZES } from '@/utils/constants';

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
        className="themeOption"
        onPress={() => handleThemeChange(option.mode)}
      >
        <View className="themeOptionContent">
          <View className="themeIconContainer">
            <Ionicons
              name={option.icon as any}
              size={24}
              color={isSelected ? colors.TEXT.WHITE : colors.TEXT.PRIMARY}
            />
          </View>
          
          <View className="themeTextContainer">
            <Text className="themeTitle">
              {t(`settings:${option.titleKey}`, option.mode)}
            </Text>
            <Text className="themeDescription">
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
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* 테마 설정 항목 */}
      <TouchableOpacity
        className="settingItem"
        onPress={openModal}
      >
        <View className="settingContent">
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={20}
            color={colors.TEXT.PRIMARY}
          />
          <Text className="settingText">
            {t('settings:theme.title', '테마')}
          </Text>
        </View>
        <View className="selectedValue">
          <Text className="settingValue">
            {getCurrentThemeText(mode)}
          </Text>
        </View>
        <Text className="settingArrow">{'>'}</Text>
      </TouchableOpacity>

      {/* 테마 선택 모달 */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          className="modalOverlay"
          activeOpacity={1}
          onPress={closeModal}
        >
          <Animated.View
            style={[
              styles.modalContent,
              { 
                backgroundColor: colors.BACKGROUND,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View className="modalHeader">
                <Text className="modalTitle">
                  {t('settings:theme.selectTheme', '테마 선택')}
                </Text>
                <TouchableOpacity
                  className="closeButton"
                  onPress={closeModal}
                >
                  <Ionicons name="close" size={20} color={colors.TEXT.PRIMARY} />
                </TouchableOpacity>
              </View>
              
              <View className="themeOptionsContainer">
                {themeOptions.map(renderThemeOption)}
              </View>
              
              <View className="modalFooter">
                <Text className="footerText">
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

