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
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { CompanyVerification, VerificationStatus, VerificationMethod } from '@/types';

interface CompanyVerificationScreenProps {
  onVerificationSubmitted: () => void;
  onSkip?: () => void;
}

export const CompanyVerificationScreen= ({
  onVerificationSubmitted,
  onSkip,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod | null>(null);
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  // 이메일 도메인에서 회사명 추출
  const extractCompanyFromEmail = (emailAddress: string): string => {
    const domain = emailAddress.split('@')[1];
    if (!domain) return '';
    
    // TODO: 확장성 개선 - 이 데이터는 백엔드 API나 별도 설정 파일로 관리 (Gemini 피드백 반영)
    const domainMappings: Record<string, string> = {
      'naver.com': '네이버',
      'kakao.com': '카카오',
      'samsung.com': '삼성전자',
      'lg.com': 'LG전자',
      'hyundai.com': '현대자동차',
      'snu.ac.kr': '서울대학교',
      'yonsei.ac.kr': '연세대학교',
      'korea.ac.kr': '고려대학교',
    };

    if (domainMappings[domain]) {
      return domainMappings[domain];
    }

    // 일반적인 회사 도메인에서 회사명 추출 (예: company.co.kr -> Company)
    const companyPart = domain.split('.')[0];
    return companyPart.charAt(0).toUpperCase() + companyPart.slice(1);
  };

  const validateEmail = (emailAddress: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailAddress);
  };

  const validateInviteCode = (code: string): boolean => {
    // 초대 코드는 8자리 영숫자 조합
    const codeRegex = /^[A-Z0-9]{8}$/;
    return codeRegex.test(code);
  };

  const handleEmailChange = (text: string): void => {
    setEmail(text);
    if (validateEmail(text)) {
      const extractedCompany = extractCompanyFromEmail(text);
      setCompanyName(extractedCompany);
    } else {
      setCompanyName('');
    }
  };

  const handleSubmitVerification = async (): Promise<void> => {
    if (!selectedMethod) {
      Alert.alert(t('common:status.error'), t('auth:companyVerification.errors.selectMethod'));
      return;
    }

    if (selectedMethod === VerificationMethod.EMAIL_DOMAIN) {
      if (!email.trim()) {
        Alert.alert(t('common:status.error'), t('auth:companyVerification.errors.enterEmail'));
        return;
      }
      if (!validateEmail(email)) {
        Alert.alert(t('common:status.error'), t('auth:companyVerification.errors.invalidEmail'));
        return;
      }
      if (!companyName.trim()) {
        Alert.alert(t('common:status.error'), t('auth:companyVerification.errors.enterCompanyName'));
        return;
      }
    }

    if (selectedMethod === VerificationMethod.INVITE_CODE) {
      if (!inviteCode.trim()) {
        Alert.alert(t('common:status.error'), t('auth:companyVerification.errors.enterInviteCode'));
        return;
      }
      if (!validateInviteCode(inviteCode)) {
        Alert.alert(t('common:status.error'), t('auth:companyVerification.errors.invalidInviteCode'));
        return;
      }
      if (!companyName.trim()) {
        Alert.alert(t('common:status.error'), t('auth:companyVerification.errors.enterCompanyName'));
        return;
      }
    }

    setIsLoading(true);

    try {
      // TODO: 실제 API 호출로 교체
      const verificationData: Partial<CompanyVerification> = {
        companyId: 'temp_company_id', // TODO: Get actual company ID from search/selection
        method: selectedMethod!,
        status: VerificationStatus.PENDING,
        submittedAt: new Date(),
        data: {
          companyName: companyName.trim(),
        },
      };

      console.log('Submitting company verification:', verificationData);

      // 임시 지연 (실제 API 호출 시뮬레이션)
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        t('auth:companyVerification.success.title'),
        t('auth:companyVerification.success.message'),
        [
          {
            text: t('common:buttons.confirm'),
            onPress: onVerificationSubmitted,
          },
        ]
      );
    } catch (error) {
      console.error('Company verification error:', error);
      // TODO: 실제 운영 환경에서는 Sentry, Firebase Crashlytics 등으로 에러 전송 (Gemini 피드백 반영)
      Alert.alert(t('common:status.error'), t('auth:companyVerification.errors.submitFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>{t('auth:companyVerification.title')}</Text>
          <Text style={styles.subtitle}>
            {t('auth:companyVerification.subtitle')}
          </Text>
          
          <View style={styles.form}>
            {/* 인증 방법 선택 */}
            <Text style={styles.label}>{t('auth:companyVerification.methodSelection.label')}</Text>
            <Text style={styles.description}>
              {t('auth:companyVerification.methodSelection.description')}
            </Text>
            
            <View style={styles.methodContainer}>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  selectedMethod === VerificationMethod.EMAIL_DOMAIN && styles.methodButtonSelected,
                ]}
                onPress={() => setSelectedMethod(VerificationMethod.EMAIL_DOMAIN)}
              >
                <Text style={[
                  styles.methodButtonText,
                  selectedMethod === VerificationMethod.EMAIL_DOMAIN && styles.methodButtonTextSelected,
                ]}>
                  {t('auth:companyVerification.methods.email.title')}
                </Text>
                <Text style={styles.methodDescription}>
                  {t('auth:companyVerification.methods.email.description')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  selectedMethod === VerificationMethod.INVITE_CODE && styles.methodButtonSelected,
                ]}
                onPress={() => setSelectedMethod(VerificationMethod.INVITE_CODE)}
              >
                <Text style={[
                  styles.methodButtonText,
                  selectedMethod === VerificationMethod.INVITE_CODE && styles.methodButtonTextSelected,
                ]}>
                  {t('auth:companyVerification.methods.inviteCode.title')}
                </Text>
                <Text style={styles.methodDescription}>
                  {t('auth:companyVerification.methods.inviteCode.description')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 이메일 인증 폼 */}
            {selectedMethod === VerificationMethod.EMAIL_DOMAIN && (
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>{t('auth:companyVerification.form.emailLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="company@example.com"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                
                {companyName && (
                  <View style={styles.companyPreview}>
                    <Text style={styles.companyPreviewLabel}>{t('auth:companyVerification.form.detectedCompany')}</Text>
                    <Text style={styles.companyPreviewText}>{companyName}</Text>
                  </View>
                )}
                
                <Text style={styles.inputLabel}>{t('auth:companyVerification.form.companyNameLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth:companyVerification.form.companyNamePlaceholder')}
                  value={companyName}
                  onChangeText={setCompanyName}
                />
              </View>
            )}

            {/* 초대 코드 인증 폼 */}
            {selectedMethod === VerificationMethod.INVITE_CODE && (
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>{t('auth:companyVerification.form.inviteCodeLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ABC12345"
                  value={inviteCode}
                  onChangeText={(text) => setInviteCode(text.toUpperCase())}
                  maxLength={8}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                
                <Text style={styles.inputLabel}>{t('auth:companyVerification.form.companyNameLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth:companyVerification.form.companyNamePlaceholder')}
                  value={companyName}
                  onChangeText={setCompanyName}
                />
              </View>
            )}
            
            <TouchableOpacity
              style={[
                styles.button,
                (!selectedMethod || isLoading) && styles.buttonDisabled,
              ]}
              onPress={handleSubmitVerification}
              disabled={!selectedMethod || isLoading}
            >
              {isLoading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color={COLORS.TEXT.WHITE} />
                  <Text style={[styles.buttonText, { marginLeft: SPACING.SM }]}>
                    {t('auth:companyVerification.form.submitting')}
                  </Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>{t('auth:companyVerification.form.submitButton')}</Text>
              )}
            </TouchableOpacity>

            {/* 건너뛰기 버튼 */}
            {onSkip && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={onSkip}
                disabled={isLoading}
              >
                <Text style={styles.skipButtonText}>{t('auth:companyVerification.form.skipButton')}</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.notice}>
            {t('auth:companyVerification.notice')}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.XL,
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
    marginBottom: SPACING.XL,
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
  methodContainer: {
    marginBottom: SPACING.XL,
  },
  methodButton: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  methodButtonSelected: {
    backgroundColor: COLORS.PRIMARY + '10',
    borderColor: COLORS.PRIMARY,
  },
  methodButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  methodButtonTextSelected: {
    color: COLORS.PRIMARY,
  },
  methodDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.LIGHT,
  },
  inputSection: {
    marginBottom: SPACING.LG,
  },
  inputLabel: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '500',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.SM,
    marginTop: SPACING.MD,
  },
  input: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    marginBottom: SPACING.SM,
  },
  companyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
    padding: SPACING.SM,
    backgroundColor: COLORS.SUCCESS + '10',
    borderRadius: 8,
  },
  companyPreviewLabel: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginRight: SPACING.SM,
  },
  companyPreviewText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.SUCCESS,
  },
  button: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
    marginTop: SPACING.LG,
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
    lineHeight: 18,
  },
  skipButton: {
    marginTop: SPACING.MD,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
  },
  skipButtonText: {
    color: COLORS.TEXT.SECONDARY,
    fontSize: FONT_SIZES.MD,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});