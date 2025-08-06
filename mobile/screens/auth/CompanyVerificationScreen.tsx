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
      Alert.alert('오류', '인증 방법을 선택해주세요.');
      return;
    }

    if (selectedMethod === VerificationMethod.EMAIL_DOMAIN) {
      if (!email.trim()) {
        Alert.alert('오류', '회사 이메일을 입력해주세요.');
        return;
      }
      if (!validateEmail(email)) {
        Alert.alert('오류', '올바른 이메일 형식이 아닙니다.');
        return;
      }
      if (!companyName.trim()) {
        Alert.alert('오류', '회사명을 입력해주세요.');
        return;
      }
    }

    if (selectedMethod === VerificationMethod.INVITE_CODE) {
      if (!inviteCode.trim()) {
        Alert.alert('오류', '초대 코드를 입력해주세요.');
        return;
      }
      if (!validateInviteCode(inviteCode)) {
        Alert.alert('오류', '초대 코드는 8자리 영문 대문자와 숫자 조합이어야 합니다.');
        return;
      }
      if (!companyName.trim()) {
        Alert.alert('오류', '회사명을 입력해주세요.');
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
        '인증 요청 완료',
        '회사 인증 요청이 제출되었습니다.\n승인까지 1-2일 소요될 수 있습니다.',
        [
          {
            text: '확인',
            onPress: onVerificationSubmitted,
          },
        ]
      );
    } catch (error) {
      console.error('Company verification error:', error);
      // TODO: 실제 운영 환경에서는 Sentry, Firebase Crashlytics 등으로 에러 전송 (Gemini 피드백 반영)
      Alert.alert('오류', '회사 인증 요청 중 오류가 발생했습니다. 다시 시도해주세요.');
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
          <Text style={styles.title}>회사 인증</Text>
          <Text style={styles.subtitle}>
            소속 회사나 대학을 인증하여{'\n'}
            공식 그룹에 참여해보세요
          </Text>
          
          <View style={styles.form}>
            {/* 인증 방법 선택 */}
            <Text style={styles.label}>인증 방법</Text>
            <Text style={styles.description}>
              회사 이메일 또는 초대 코드로 인증할 수 있습니다.
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
                  회사 이메일 인증
                </Text>
                <Text style={styles.methodDescription}>
                  회사 도메인 이메일로 인증
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
                  초대 코드 인증
                </Text>
                <Text style={styles.methodDescription}>
                  회사에서 제공한 초대 코드로 인증
                </Text>
              </TouchableOpacity>
            </View>

            {/* 이메일 인증 폼 */}
            {selectedMethod === VerificationMethod.EMAIL_DOMAIN && (
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>회사 이메일</Text>
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
                    <Text style={styles.companyPreviewLabel}>감지된 회사:</Text>
                    <Text style={styles.companyPreviewText}>{companyName}</Text>
                  </View>
                )}
                
                <Text style={styles.inputLabel}>회사명 (수정 가능)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="회사명을 입력하세요"
                  value={companyName}
                  onChangeText={setCompanyName}
                />
              </View>
            )}

            {/* 초대 코드 인증 폼 */}
            {selectedMethod === VerificationMethod.INVITE_CODE && (
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>초대 코드</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ABC12345"
                  value={inviteCode}
                  onChangeText={(text) => setInviteCode(text.toUpperCase())}
                  maxLength={8}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                
                <Text style={styles.inputLabel}>회사명</Text>
                <TextInput
                  style={styles.input}
                  placeholder="회사명을 입력하세요"
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
                    제출 중...
                  </Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>인증 요청하기</Text>
              )}
            </TouchableOpacity>

            {/* 건너뛰기 버튼 */}
            {onSkip && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={onSkip}
                disabled={isLoading}
              >
                <Text style={styles.skipButtonText}>나중에 인증하기</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.notice}>
            • 회사 인증은 관리자 승인 후 1-2일 내 완료됩니다{'\n'}
            • 승인 완료 시 푸시 알림으로 안내해드립니다{'\n'}
            • 인증 후 해당 회사 공식 그룹에 자동 가입됩니다
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