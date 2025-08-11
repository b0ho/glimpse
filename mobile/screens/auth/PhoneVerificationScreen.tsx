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
import { useAuthService } from '@/services/auth/auth-service';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

interface PhoneVerificationScreenProps {
  onVerificationSent: (phoneNumber: string) => void;
}

export const PhoneVerificationScreen = ({
  onVerificationSent,
}: PhoneVerificationScreenProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const authService = useAuthService();
  const { t } = useTranslation('auth');

  const formatPhoneInput = (input: string): string => {
    // 숫자만 추출
    const numbers = input.replace(/\D/g, '');
    
    // 한국 전화번호 형식으로 포맷팅
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const numbers = phone.replace(/\D/g, '');
    return numbers.length === 11 && numbers.startsWith('010');
  };

  const handleSendVerification = async (): Promise<void> => {
    if (!phoneNumber.trim()) {
      Alert.alert(t('common:errors.error'), t('phoneVerification.errors.phoneRequired'));
      return;
    }

    const rawNumbers = phoneNumber.replace(/\D/g, '');
    if (!validatePhoneNumber(rawNumbers)) {
      Alert.alert(t('common:errors.error'), t('phoneVerification.errors.invalidPhone'));
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.signInWithPhone(rawNumbers);
      
      if (result.success) {
        Alert.alert(
          t('phoneVerification.success.title'),
          t('phoneVerification.success.message'),
          [
            {
              text: t('common:actions.confirm'),
              onPress: () => onVerificationSent(rawNumbers),
            },
          ]
        );
      } else {
        Alert.alert(t('common:errors.error'), typeof result.error === 'string' ? result.error : result.error?.message || t('phoneVerification.errors.sendFailed'));
      }
    } catch (error) {
      console.error('Phone verification error:', error);
      Alert.alert(t('common:errors.error'), t('phoneVerification.errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (text: string): void => {
    const formatted = formatPhoneInput(text);
    if (formatted.length <= 13) { // 010-1234-5678 형식 최대 길이
      setPhoneNumber(formatted);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{t('phoneVerification.title')}</Text>
        <Text style={styles.subtitle}>{t('phoneVerification.subtitle')}</Text>
        
        <View style={styles.form}>
          <Text style={styles.label}>{t('phoneVerification.phoneLabel')}</Text>
          <Text style={styles.description}>
            {t('phoneVerification.description')}
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder={t('phoneVerification.placeholder')}
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            maxLength={13}
            autoFocus
          />
          
          <TouchableOpacity
            style={[
              styles.button,
              (!phoneNumber.trim() || isLoading) && styles.buttonDisabled,
            ]}
            onPress={handleSendVerification}
            disabled={!phoneNumber.trim() || isLoading}
          >
            {isLoading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color={COLORS.TEXT.WHITE} />
                <Text style={[styles.buttonText, { marginLeft: SPACING.SM }]}>
                  {t('phoneVerification.sendingButton')}
                </Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>{t('phoneVerification.sendButton')}</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <Text style={styles.privacy}>
          {t('phoneVerification.privacyNotice')}
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
    fontSize: FONT_SIZES.XXXL,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  subtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
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
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    marginBottom: SPACING.LG,
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
  privacy: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.LIGHT,
    textAlign: 'center',
    lineHeight: 16,
  },
});