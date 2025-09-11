import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useAuthService } from '@/services/auth/auth-service';
import { useTheme } from '@/hooks/useTheme';
import { LIGHT_COLORS, DARK_COLORS, SIZES } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { validatePhoneNumber as validatePhone } from '@/services/auth/clerk-config';

interface PhoneVerificationScreenProps {
  onVerificationSent: (phoneNumber: string) => void;
  authMode?: 'signin' | 'signup';
  onBack?: () => void;
}

const { width } = Dimensions.get('window');

export const PhoneVerificationScreen = ({
  onVerificationSent,
  authMode = 'signin',
  onBack,
}: PhoneVerificationScreenProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const authService = useAuthService();
  const { t } = useAndroidSafeTranslation('auth');
  const { colors, isDarkMode } = useTheme();
  
  // 애니메이션 값
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const inputBorderAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // 페이드인 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const animateInputFocus = (focused: boolean) => {
    Animated.timing(inputBorderAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

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
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={isDarkMode ? DARK_COLORS.TEXT.PRIMARY : LIGHT_COLORS.TEXT.PRIMARY} 
            />
            <Text style={[styles.backButtonText, { color: isDarkMode ? DARK_COLORS.TEXT.PRIMARY : LIGHT_COLORS.TEXT.PRIMARY }]}>
              뒤로가기
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* 타이틀 섹션 */}
        <View style={styles.titleSection}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={isDarkMode ? ['#FF8A8A', '#FF6B6B'] : ['#FF6B6B', '#FF5252']}
              style={styles.gradientIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="phone-portrait" size={32} color="white" />
            </LinearGradient>
          </View>
          <Text style={[styles.title, { color: isDarkMode ? DARK_COLORS.PRIMARY : LIGHT_COLORS.PRIMARY }]}>
            {authMode === 'signup' ? t('auth:phoneVerification.signup.title') : t('auth:phoneVerification.title')}
          </Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? DARK_COLORS.TEXT.SECONDARY : LIGHT_COLORS.TEXT.SECONDARY }]}>
            {authMode === 'signup' ? t('auth:phoneVerification.signup.subtitle') : t('auth:phoneVerification.subtitle')}
          </Text>
        </View>
        
        {/* 폼 섹션 */}
        <View style={styles.form}>
          <View style={styles.labelContainer}>
            <Text style={[styles.label, { color: isDarkMode ? DARK_COLORS.TEXT.PRIMARY : LIGHT_COLORS.TEXT.PRIMARY }]}>
              {t('auth:phoneVerification.phoneLabel')}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>필수</Text>
            </View>
          </View>
          
          <Text style={[styles.description, { color: isDarkMode ? DARK_COLORS.TEXT.SECONDARY : LIGHT_COLORS.TEXT.SECONDARY }]}>
            {t('auth:phoneVerification.description')}
          </Text>
          
          {/* 입력 필드 */}
          <Animated.View
            style={[
              styles.inputContainer,
              {
                borderColor: inputBorderAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [
                    isDarkMode ? DARK_COLORS.BORDER : LIGHT_COLORS.BORDER,
                    isDarkMode ? DARK_COLORS.PRIMARY : LIGHT_COLORS.PRIMARY,
                  ],
                }),
                borderWidth: inputBorderAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 2],
                }),
              },
            ]}
          >
            <View style={styles.inputPrefix}>
              <Ionicons 
                name="call-outline" 
                size={20} 
                color={isFocused 
                  ? (isDarkMode ? DARK_COLORS.PRIMARY : LIGHT_COLORS.PRIMARY)
                  : (isDarkMode ? DARK_COLORS.TEXT.TERTIARY : LIGHT_COLORS.TEXT.TERTIARY)
                } 
              />
              <Text style={[
                styles.countryCode,
                { color: isDarkMode ? DARK_COLORS.TEXT.PRIMARY : LIGHT_COLORS.TEXT.PRIMARY }
              ]}>
                +82
              </Text>
            </View>
            <TextInput
              style={[styles.input, { 
                color: isDarkMode ? DARK_COLORS.TEXT.PRIMARY : LIGHT_COLORS.TEXT.PRIMARY
              }]}
              placeholder="10-1234-5678"
              placeholderTextColor={isDarkMode ? DARK_COLORS.TEXT.TERTIARY : LIGHT_COLORS.TEXT.TERTIARY}
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              maxLength={13}
              autoFocus
              onFocus={() => {
                setIsFocused(true);
                animateInputFocus(true);
              }}
              onBlur={() => {
                setIsFocused(false);
                animateInputFocus(false);
              }}
            />
          </Animated.View>
          
          {/* 버튼 */}
          <TouchableOpacity
            onPress={handleSendVerification}
            disabled={!phoneNumber.trim() || isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                !phoneNumber.trim() || isLoading
                  ? isDarkMode ? ['#48484A', '#48484A'] : ['#CED4DA', '#CED4DA']
                  : isDarkMode ? ['#FF8A8A', '#FF6B6B'] : ['#FF6B6B', '#FF5252']
              }
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                    {authMode === 'signup' ? t('auth:phoneVerification.signup.sendingButton') : t('auth:phoneVerification.sendingButton')}
                  </Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>
                    {authMode === 'signup' ? t('auth:phoneVerification.signup.sendButton') : t('auth:phoneVerification.sendButton')}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* 개인정보 안내 */}
        <View style={styles.privacyContainer}>
          <Ionicons 
            name="shield-checkmark-outline" 
            size={16} 
            color={isDarkMode ? DARK_COLORS.TEXT.TERTIARY : LIGHT_COLORS.TEXT.TERTIARY} 
          />
          <Text style={[styles.privacy, { color: isDarkMode ? DARK_COLORS.TEXT.TERTIARY : LIGHT_COLORS.TEXT.TERTIARY }]}>
            {t('auth:phoneVerification.privacyNotice')}
          </Text>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  gradientIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0px 8px 24px rgba(255, 107, 107, 0.3)',
      } as any,
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  form: {
    marginBottom: 32,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
      } as any,
    }),
  },
  inputPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 8,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Platform.OS === 'ios' ? 18 : 16,
    paddingRight: 16,
  },
  gradientButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 4px 16px rgba(255, 107, 107, 0.25)',
      } as any,
    }),
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  privacy: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginLeft: 6,
  },
});