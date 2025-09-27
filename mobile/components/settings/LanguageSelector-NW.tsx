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
// Types from shared - copied for now
type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh' | 'vi' | 'th' | 'es' | 'fr';

interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
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

interface LanguageSelectorProps {
  onLanguageChange?: (language: SupportedLanguage) => void;
}

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

