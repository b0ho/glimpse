import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/slices/authSlice';
import { COLORS, SPACING, FONT_SIZES, REGEX } from '@/utils/constants';
import { Gender } from '@/types';

interface NicknameSetupScreenProps {
  onNicknameSet: () => void;
}

export const NicknameSetupScreen = ({
  onNicknameSet,
}: NicknameSetupScreenProps) => {
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const authStore = useAuthStore();
  const { t } = useTranslation();

  const validateNickname = (text: string): boolean => {
    return REGEX.NICKNAME.test(text);
  };

  const checkNicknameAvailability = async (text: string): Promise<void> => {
    if (!validateNickname(text)) {
      setIsAvailable(false);
      return;
    }

    // 실제로는 백엔드 API를 호출하여 닉네임 중복을 확인
    // 지금은 간단한 로컬 검증만 구현
    const unavailableNicknames = ['admin', 'system', 'glimpse', 'administrator', '관리자'];
    const available = !unavailableNicknames.includes(text.toLowerCase());
    setIsAvailable(available);
  };

  const handleNicknameChange = (text: string): void => {
    setNickname(text);
    setIsAvailable(null);
    
    // 개선된 디바운싱 (Gemini 피드백 반영)
    if (text.length >= 2) {
      setTimeout(() => {
        checkNicknameAvailability(text);
      }, 500);
    }
  };

  const handleSetNickname = async (): Promise<void> => {
    if (!nickname.trim()) {
      Alert.alert(t('common:status.error'), t('auth:nicknameSetup.errors.enterNickname'));
      return;
    }

    if (!gender) {
      Alert.alert(t('common:status.error'), t('auth:nicknameSetup.errors.selectGender'));
      return;
    }

    if (!validateNickname(nickname)) {
      Alert.alert(t('common:status.error'), t('auth:nicknameSetup.errors.invalidNickname'));
      return;
    }

    if (isAvailable === false) {
      Alert.alert(t('common:status.error'), t('auth:nicknameSetup.errors.nicknameInUse'));
      return;
    }

    setIsLoading(true);

    try {
      // 사용자 정보 업데이트 (닉네임 + 성별)
      authStore.updateUser({ 
        nickname: nickname.trim(),
        gender: gender,
      });
      
      Alert.alert(
        t('auth:nicknameSetup.success.title'),
        t('auth:nicknameSetup.success.message', { nickname }),
        [
          {
            text: t('common:buttons.confirm'),
            onPress: onNicknameSet,
          },
        ]
      );
    } catch (error) {
      console.error('Profile setup error:', error);
      // TODO: 실제 운영 환경에서는 Sentry, Firebase Crashlytics 등으로 에러 전송
      Alert.alert(t('common:status.error'), t('auth:nicknameSetup.errors.setupFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const getInputBorderColor = (): string => {
    if (!nickname) return COLORS.BORDER;
    if (isAvailable === true) return COLORS.SUCCESS;
    if (isAvailable === false) return COLORS.ERROR;
    return COLORS.PRIMARY;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{t('auth:nicknameSetup.title')}</Text>
        <Text style={styles.subtitle}>
          {t('auth:nicknameSetup.subtitle')}
        </Text>
        
        <View style={styles.form}>
          {/* 성별 선택 */}
          <Text style={styles.label}>{t('auth:nicknameSetup.gender.label')}</Text>
          <Text style={styles.description}>
            {t('auth:nicknameSetup.gender.description')}
          </Text>
          
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === 'MALE' && styles.genderButtonSelected,
              ]}
              onPress={() => setGender('MALE')}
            >
              <Text style={[
                styles.genderButtonText,
                gender === 'MALE' && styles.genderButtonTextSelected,
              ]}>
                {t('common:gender.male')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === 'FEMALE' && styles.genderButtonSelected,
              ]}
              onPress={() => setGender('FEMALE')}
            >
              <Text style={[
                styles.genderButtonText,
                gender === 'FEMALE' && styles.genderButtonTextSelected,
              ]}>
                {t('common:gender.female')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 닉네임 입력 */}
          <Text style={[styles.label, { marginTop: SPACING.XL }]}>{t('auth:nicknameSetup.nickname.label')}</Text>
          <Text style={styles.description}>
            {t('auth:nicknameSetup.nickname.description')}
          </Text>
          
          <TextInput
            style={[
              styles.input,
              { borderColor: getInputBorderColor() }
            ]}
            placeholder={t('auth:nicknameSetup.nickname.placeholder')}
            value={nickname}
            onChangeText={handleNicknameChange}
            maxLength={20}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          {nickname && (
            <View style={styles.validationContainer}>
              {isAvailable === null && nickname.length >= 2 && (
                <Text style={styles.checkingText}>{t('auth:nicknameSetup.nickname.checking')}</Text>
              )}
              {isAvailable === true && (
                <Text style={styles.availableText}>✓ {t('auth:nicknameSetup.nickname.available')}</Text>
              )}
              {isAvailable === false && (
                <Text style={styles.unavailableText}>
                  {validateNickname(nickname) 
                    ? t('auth:nicknameSetup.errors.nicknameInUse') 
                    : t('auth:nicknameSetup.errors.invalidNicknameFormat')
                  }
                </Text>
              )}
            </View>
          )}
          
          <TouchableOpacity
            style={[
              styles.button,
              (!nickname.trim() || !gender || isLoading || isAvailable === false) && styles.buttonDisabled,
            ]}
            onPress={handleSetNickname}
            disabled={!nickname.trim() || !gender || isLoading || isAvailable === false}
          >
            {isLoading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color={COLORS.TEXT.WHITE} />
                <Text style={[styles.buttonText, { marginLeft: SPACING.SM }]}>
                  {t('auth:nicknameSetup.settingUp')}
                </Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>{t('auth:nicknameSetup.submitButton')}</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <Text style={styles.notice}>
          {t('auth:nicknameSetup.notice')}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.LG,
  },
  title: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  subtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.XXL,
  },
  form: {
    marginBottom: SPACING.XXL,
  },
  label: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.SM,
  },
  description: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 20,
    marginBottom: SPACING.LG,
  },
  input: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    marginBottom: SPACING.SM,
  },
  validationContainer: {
    marginBottom: SPACING.LG,
  },
  checkingText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
  },
  availableText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.SUCCESS,
    fontWeight: '500',
  },
  unavailableText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.ERROR,
    fontWeight: '500',
  },
  button: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: COLORS.TEXT.LIGHT,
  },
  buttonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.LIGHT,
    textAlign: 'center',
    lineHeight: 16,
  },
  genderContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.LG,
    gap: SPACING.MD,
  },
  genderButton: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
  },
  genderButtonSelected: {
    backgroundColor: COLORS.PRIMARY + '10',
    borderColor: COLORS.PRIMARY,
  },
  genderButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '500',
    color: COLORS.TEXT.SECONDARY,
  },
  genderButtonTextSelected: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
});