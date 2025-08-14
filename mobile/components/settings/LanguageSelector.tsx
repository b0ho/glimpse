import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
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
        <View style={styles.languageInfo}>
          <Text style={styles.flag}>{item.flag}</Text>
          <View style={styles.languageText}>
            <Text style={[
              styles.languageName,
              { color: colors.TEXT.PRIMARY },
              isSelected && [styles.selectedText, { color: colors.PRIMARY }],
            ]}>
              {item.nativeName}
            </Text>
            <Text style={[styles.languageNameEnglish, { color: colors.TEXT.SECONDARY }]}>
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
        style={[styles.selector, { borderBottomColor: colors.BORDER }]}
        onPress={() => setIsModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          <Ionicons name="language" size={20} color={colors.TEXT.PRIMARY} />
          <Text style={[styles.label, { color: colors.TEXT.PRIMARY }]}>
            {t('settings:language.title', 'Language')}
          </Text>
        </View>
        <View style={styles.selectedValue}>
          <Text style={styles.selectedFlag}>{currentLangInfo.flag}</Text>
          <Text style={[styles.selectedLanguage, { color: colors.TEXT.SECONDARY }]}>
            {currentLangInfo.nativeName}
          </Text>
        </View>
        <Text style={[styles.arrow, { color: colors.TEXT.SECONDARY }]}>{'>'}</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.BACKGROUND + '80' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.SURFACE }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.BORDER }]}>
              <Text style={[styles.modalTitle, { color: colors.TEXT.PRIMARY }]}>
                {t('settings:language.selectLanguage', 'Select Language')}
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.TEXT.PRIMARY} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={Object.values(SUPPORTED_LANGUAGES)}
              keyExtractor={(item) => item.code}
              renderItem={renderLanguageItem}
              ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.BORDER }]} />}
              contentContainerStyle={styles.languageList}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '500',
    marginLeft: SPACING.SM,
  },
  selectedValue: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    marginRight: SPACING.SM,
  },
  selectedFlag: {
    fontSize: 18,
    marginRight: SPACING.XS,
  },
  selectedLanguage: {
    fontSize: FONT_SIZES.SM,
  },
  arrow: {
    fontSize: 18,
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  languageList: {
    paddingVertical: 8,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  selectedLanguageItem: {
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flag: {
    fontSize: 28,
  },
  languageText: {
    gap: 2,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
  },
  languageNameEnglish: {
    fontSize: 12,
    fontWeight: 'normal',
  },
  selectedText: {
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    marginHorizontal: 20,
  },
});