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
  StyleSheet,
  Modal,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['settings', 'common']);
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
        style={[
          styles.themeOption,
          { 
            backgroundColor: colors.SURFACE,
            borderColor: isSelected ? colors.PRIMARY : colors.BORDER,
            borderWidth: isSelected ? 2 : 1,
          }
        ]}
        onPress={() => handleThemeChange(option.mode)}
      >
        <View style={styles.themeOptionContent}>
          <View style={[
            styles.themeIconContainer,
            { backgroundColor: isSelected ? colors.PRIMARY : colors.BACKGROUND }
          ]}>
            <Ionicons
              name={option.icon as any}
              size={24}
              color={isSelected ? colors.TEXT.WHITE : colors.TEXT.PRIMARY}
            />
          </View>
          
          <View style={styles.themeTextContainer}>
            <Text style={[
              styles.themeTitle,
              { 
                color: colors.TEXT.PRIMARY,
                fontWeight: isSelected ? 'bold' : 'normal'
              }
            ]}>
              {t(`settings:${option.titleKey}`, option.mode)}
            </Text>
            <Text style={[
              styles.themeDescription,
              { color: colors.TEXT.SECONDARY }
            ]}>
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
        style={[styles.settingItem, { borderBottomColor: colors.BORDER }]}
        onPress={openModal}
      >
        <View style={styles.settingContent}>
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={20}
            color={colors.TEXT.PRIMARY}
          />
          <Text style={[styles.settingText, { color: colors.TEXT.PRIMARY }]}>
            {t('settings:theme.title', '테마')}
          </Text>
        </View>
        <Text style={[styles.settingValue, { color: colors.TEXT.SECONDARY }]}>
          {getCurrentThemeText(mode)}
        </Text>
        <Text style={[styles.settingArrow, { color: colors.TEXT.SECONDARY }]}>{'>'}</Text>
      </TouchableOpacity>

      {/* 테마 선택 모달 */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: colors.OVERLAY }]}
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
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.TEXT.PRIMARY }]}>
                  {t('settings:theme.selectTheme', '테마 선택')}
                </Text>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.SURFACE }]}
                  onPress={closeModal}
                >
                  <Ionicons name="close" size={20} color={colors.TEXT.PRIMARY} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.themeOptionsContainer}>
                {themeOptions.map(renderThemeOption)}
              </View>
              
              <View style={[styles.modalFooter, { borderTopColor: colors.BORDER }]}>
                <Text style={[styles.footerText, { color: colors.TEXT.SECONDARY }]}>
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

const styles = StyleSheet.create({
  // 설정 항목 스타일 (ProfileScreen과 일관성 맞춤)
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '500',
    marginLeft: SPACING.SM,
  },
  settingValue: {
    fontSize: FONT_SIZES.SM,
    marginRight: SPACING.XS,
  },
  settingArrow: {
    fontSize: 18,
    fontWeight: '300',
  },

  // 모달 스타일
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: SPACING.LG,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  modalTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 테마 옵션 스타일
  themeOptionsContainer: {
    gap: SPACING.MD,
  },
  themeOption: {
    borderRadius: 12,
    padding: SPACING.MD,
  },
  themeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  themeTextContainer: {
    flex: 1,
  },
  themeTitle: {
    fontSize: FONT_SIZES.MD,
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: FONT_SIZES.SM,
    lineHeight: 18,
  },

  // 모달 푸터 스타일
  modalFooter: {
    marginTop: SPACING.LG,
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: FONT_SIZES.SM,
    textAlign: 'center',
    lineHeight: 18,
  },
});