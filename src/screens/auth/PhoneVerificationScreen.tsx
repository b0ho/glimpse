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
} from 'react-native';
import { useAuthService } from '@/services/auth/auth-service';
import { COLORS, SPACING, FONT_SIZES, REGEX } from '@/utils/constants';

interface PhoneVerificationScreenProps {
  onVerificationSent: (phoneNumber: string) => void;
}

export const PhoneVerificationScreen: React.FC<PhoneVerificationScreenProps> = ({
  onVerificationSent,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const authService = useAuthService();

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
      Alert.alert('오류', '전화번호를 입력해주세요.');
      return;
    }

    const rawNumbers = phoneNumber.replace(/\D/g, '');
    if (!validatePhoneNumber(rawNumbers)) {
      Alert.alert('오류', '올바른 전화번호를 입력해주세요. (010으로 시작하는 11자리)');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.signInWithPhone(rawNumbers);
      
      if (result.success) {
        Alert.alert(
          '인증번호 전송',
          '입력하신 전화번호로 인증번호를 전송했습니다.',
          [
            {
              text: '확인',
              onPress: () => onVerificationSent(rawNumbers),
            },
          ]
        );
      } else {
        Alert.alert('오류', result.error || '인증번호 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('Phone verification error:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다. 다시 시도해주세요.');
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
        <Text style={styles.title}>🌟 Glimpse</Text>
        <Text style={styles.subtitle}>익명 데이팅의 새로운 시작</Text>
        
        <View style={styles.form}>
          <Text style={styles.label}>전화번호</Text>
          <Text style={styles.description}>
            SMS 인증을 통해 안전하게 가입하세요.{'\n'}
            개인정보는 철저히 보호됩니다.
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="010-1234-5678"
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
            <Text style={styles.buttonText}>
              {isLoading ? '전송 중...' : '인증번호 받기'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.privacy}>
          계속 진행하면 개인정보 처리방침과{'\n'}
          서비스 이용약관에 동의하는 것으로 간주됩니다.
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
  privacy: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.LIGHT,
    textAlign: 'center',
    lineHeight: 16,
  },
});