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
  Pressable,
} from 'react-native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useAuthService } from '@/services/auth/auth-service';
import { useTheme } from '@/hooks/useTheme';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { validatePhoneNumber as validatePhone } from '@/services/auth/clerk-config';

interface PhoneVerificationScreenProps {
  onVerificationSent: (phoneNumber: string) => void;
  authMode?: 'signin' | 'signup';
  onBack?: () => void;
}

export const PhoneVerificationScreen = ({
  onVerificationSent,
  authMode = 'signin',
  onBack,
}: PhoneVerificationScreenProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const authService = useAuthService();
  const { t } = useAndroidSafeTranslation('auth');
  const { colors } = useTheme();

  const formatPhoneInput = (input: string): string => {
    // 숫자만 추출
    const numbers = input.replace(/\D/g, '');
    
    // 한국 전화번호 형식으로 포맷팅
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };


  const handleSendVerification = async (): Promise<void> => {
    console.log('🔍 handleSendVerification called');
    console.log('📱 Phone number:', phoneNumber);
    console.log('🎯 Auth mode:', authMode);
    
    if (!phoneNumber.trim()) {
      console.log('❌ Phone number is empty');
      Alert.alert(t('common:errors.error'), t('auth:phoneVerification.errors.phoneRequired'));
      return;
    }

    const rawNumbers = phoneNumber.replace(/\D/g, '');
    console.log('📞 Raw numbers:', rawNumbers);
    
    if (!validatePhone(rawNumbers)) {
      console.log('❌ Phone validation failed');
      Alert.alert(t('common:errors.error'), t('auth:phoneVerification.errors.invalidPhone'));
      return;
    }

    console.log('⏳ Starting verification process');
    setIsLoading(true);

    try {
      console.log('🚀 Calling auth service, mode:', authMode);
      // authMode에 따라 다른 서비스 메소드 호출
      const result = authMode === 'signup' 
        ? await authService.signUpWithPhone(rawNumbers)
        : await authService.signInWithPhone(rawNumbers);
      
      console.log('📨 Auth service result:', result);
      
      if (result.success) {
        const titleKey = authMode === 'signup' ? 'phoneVerification.signup.success.title' : 'phoneVerification.success.title';
        const messageKey = authMode === 'signup' ? 'phoneVerification.signup.success.message' : 'phoneVerification.success.message';
        
        console.log('✅ Success, moving to SMS verification');
        
        // 웹 환경에서는 Alert 콜백이 작동하지 않을 수 있으므로 플랫폼별 처리
        if (Platform.OS === 'web') {
          // 웹에서는 바로 다음 화면으로 이동
          onVerificationSent(rawNumbers);
          // 옵션: 토스트 메시지나 다른 방식으로 알림
          window.alert(`${t(titleKey)}\n${t(messageKey)}`);
        } else {
          // 네이티브에서는 Alert 사용
          Alert.alert(
            t(titleKey),
            t(messageKey),
            [
              {
                text: t('common:actions.confirm'),
                onPress: () => onVerificationSent(rawNumbers),
              },
            ]
          );
        }
      } else {
        console.log('❌ Auth service failed:', result.error);
        Alert.alert(t('common:errors.error'), typeof result.error === 'string' ? result.error : result.error?.message || t('auth:phoneVerification.errors.sendFailed'));
      }
    } catch (error) {
      console.error('🔥 Phone verification error:', error);
      Alert.alert(t('common:errors.error'), t('auth:phoneVerification.errors.networkError'));
    } finally {
      console.log('🏁 Verification process finished');
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
      style={[styles.container, { backgroundColor: colors.BACKGROUND }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {onBack && (
        <View style={styles.header}>
          <Pressable
            style={[styles.backButton, { backgroundColor: colors.SURFACE }]}
            onPress={onBack}
          >
            <Text style={[styles.backButtonText, { color: colors.TEXT.PRIMARY }]}>← 뒤로가기</Text>
          </Pressable>
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.PRIMARY }]}>
          {authMode === 'signup' ? t('auth:phoneVerification.signup.title') : t('auth:phoneVerification.title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.TEXT.SECONDARY }]}>
          {authMode === 'signup' ? t('auth:phoneVerification.signup.subtitle') : t('auth:phoneVerification.subtitle')}
        </Text>
        
        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.TEXT.PRIMARY }]}>{t('auth:phoneVerification.phoneLabel')}</Text>
          <Text style={[styles.description, { color: colors.TEXT.SECONDARY }]}>
            {t('auth:phoneVerification.description')}
          </Text>
          
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.SURFACE,
              borderColor: colors.BORDER,
              color: colors.TEXT.PRIMARY
            }]}
            placeholder={t('auth:phoneVerification.placeholder')}
            placeholderTextColor={colors.TEXT.LIGHT}
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            maxLength={13}
            autoFocus
          />
          
          <Pressable
            style={[
              styles.button,
              { backgroundColor: colors.PRIMARY },
              (!phoneNumber.trim() || isLoading) && [styles.buttonDisabled, { backgroundColor: colors.TEXT.LIGHT }],
            ]}
            onPress={handleSendVerification}
            disabled={!phoneNumber.trim() || isLoading}
          >
            {isLoading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color={colors.TEXT.WHITE} />
                <Text style={[styles.buttonText, { color: colors.TEXT.WHITE, marginLeft: SPACING.SM }]}>
                  {authMode === 'signup' ? t('auth:phoneVerification.signup.sendingButton') : t('auth:phoneVerification.sendingButton')}
                </Text>
              </View>
            ) : (
              <Text style={[styles.buttonText, { color: colors.TEXT.WHITE }]}>
                {authMode === 'signup' ? t('auth:phoneVerification.signup.sendButton') : t('auth:phoneVerification.sendButton')}
              </Text>
            )}
          </Pressable>
        </View>
        
        <Text style={[styles.privacy, { color: colors.TEXT.LIGHT }]}>
          {t('auth:phoneVerification.privacyNotice')}
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
  header: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    paddingTop: SPACING.XL, // Safe area 고려
  },
  backButton: {
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '500',
    color: COLORS.TEXT.PRIMARY,
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