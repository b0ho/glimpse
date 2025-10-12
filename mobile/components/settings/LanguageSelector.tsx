/**
 * LanguageSelector 컴포넌트 (NativeWind v4 버전)
 *
 * @module LanguageSelector
 * @description 앱 내 언어 설정을 관리하는 컴포넌트입니다. 8개 언어를 지원하며 모달 방식의 선택 인터페이스를 제공합니다.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

/**
 * 지원되는 언어 코드 타입
 * @typedef {('ko'|'en'|'ja'|'zh'|'vi'|'th'|'es'|'fr')} SupportedLanguage
 */
type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh' | 'vi' | 'th' | 'es' | 'fr';

/**
 * 언어 정보 인터페이스
 * @interface LanguageInfo
 */
interface LanguageInfo {
  /** 언어 코드 (예: 'ko', 'en') */
  code: SupportedLanguage;
  /** 영문 언어명 (예: 'Korean', 'English') */
  name: string;
  /** 현지어 언어명 (예: '한국어', 'English') */
  nativeName: string;
  /** 국기 이모지 */
  flag: string;
}

const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageInfo> = {
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  zh: { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  vi: { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  th: { code: 'th', name: 'Thai', nativeName: 'ภาษาไทย', flag: '🇹🇭' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
};
import { changeLanguage, getCurrentLanguage } from '../../services/i18n/i18n';
import { SPACING, FONT_SIZES } from '@/utils/constants';

/**
 * LanguageSelector 컴포넌트 Props 인터페이스
 * @interface LanguageSelectorProps
 */
interface LanguageSelectorProps {
  /** 언어 변경 시 호출되는 콜백 함수 */
  onLanguageChange?: (language: SupportedLanguage) => void;
}

/**
 * LanguageSelector 컴포넌트
 *
 * @component
 * @param {LanguageSelectorProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 언어 선택기 UI
 *
 * @description
 * 다국어 지원 앱에서 사용자가 선호하는 언어를 선택할 수 있게 합니다.
 * - 8개 언어 지원 (한국어, 영어, 일본어, 중국어, 베트남어, 태국어, 스페인어, 프랑스어)
 * - 모달 기반 선택 인터페이스
 * - 국기 이모지와 현지어 표시
 * - 선택된 언어 체크 표시
 * - 성공/실패 피드백 알림
 * - 비동기 언어 변경 처리
 *
 * @example
 * ```tsx
 * <LanguageSelector
 *   onLanguageChange={(language) => {
 *     console.log('언어 변경:', language);
 *   }}
 * />
 * ```
 *
 * @category Component
 * @subcategory Settings
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  onLanguageChange 
}) => {
  const { t, i18n } = useAndroidSafeTranslation();
  const { colors } = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    getCurrentLanguage()
  );
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageSelect = async (language: SupportedLanguage) => {
    if (language === currentLanguage) {
      setIsModalVisible(false);
      return;
    }

    setIsChanging(true);
    const success = await changeLanguage(language);
    
    if (success) {
      setCurrentLanguage(language);
      setIsModalVisible(false);
      onLanguageChange?.(language);
      
      // Show success message
      Alert.alert(
        t('settings:language.changeSuccess'),
        t('settings:language.changeSuccessMessage'),
        [{ text: t('common:buttons.confirm') }]
      );
    } else {
      Alert.alert(
        t('settings:language.changeFailed'),
        t('settings:language.changeFailedMessage'),
        [{ text: t('common:buttons.retry') }]
      );
    }
    
    setIsChanging(false);
  };

  const renderLanguageItem = ({ item }: { item: LanguageInfo }) => {
    const isSelected = item.code === currentLanguage;
    
    return (
      <TouchableOpacity
        style={[
          styles.languageItem,
          isSelected && [styles.selectedLanguageItem, { backgroundColor: colors.PRIMARY + '20' }],
        ]}
        onPress={() => handleLanguageSelect(item.code)}
        disabled={isChanging}
      >
        <View className="languageInfo">
          <Text className="flag">{item.flag}</Text>
          <View className="languageText">
            <Text style={[
              styles.languageName,
              { color: colors.TEXT.PRIMARY },
              isSelected && [styles.selectedText, { color: colors.PRIMARY }],
            ]}>
              {item.nativeName}
            </Text>
            <Text className="languageNameEnglish">
              {item.name}
            </Text>
          </View>
        </View>
        {isSelected && (
          <Ionicons 
            name="checkmark-circle" 
            size={24} 
            color={colors.PRIMARY} 
          />
        )}
      </TouchableOpacity>
    );
  };

  const currentLangInfo = SUPPORTED_LANGUAGES[currentLanguage];

  return (
    <>
      <TouchableOpacity
        className="selector"
        onPress={() => setIsModalVisible(true)}
      >
        <View className="selectorContent">
          <Ionicons name="language" size={20} color={colors.TEXT.PRIMARY} />
          <Text className="label">
            {t('settings:language.title', 'Language')}
          </Text>
        </View>
        <View className="selectedValue">
          <Text className="selectedFlag">{currentLangInfo.flag}</Text>
          <Text className="selectedLanguage">
            {currentLangInfo.nativeName}
          </Text>
        </View>
        <Text className="arrow">{'>'}</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="modalOverlay">
          <View className="modalContent">
            <View className="modalHeader">
              <Text className="modalTitle">
                {t('settings:language.selectLanguage', 'Select Language')}
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                className="closeButton"
              >
                <Ionicons name="close" size={24} color={colors.TEXT.PRIMARY} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={Object.values(SUPPORTED_LANGUAGES)}
              keyExtractor={(item) => item.code}
              renderItem={renderLanguageItem}
              ItemSeparatorComponent={() => <View className="separator" />}
              contentContainerStyle={styles.languageList}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

