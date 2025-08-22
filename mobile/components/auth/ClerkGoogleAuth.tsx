import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useOAuth, useAuth } from '@clerk/clerk-expo';
import { useAuthStore } from '@/store/slices/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { SPACING, FONT_SIZES } from '@/utils/constants';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface ClerkGoogleAuthProps {
  onSuccess: () => void;
}

/**
 * Clerk Google OAuth 컴포넌트
 * Clerk의 OAuth Hook을 사용하여 Google 로그인 처리
 */
export const ClerkGoogleAuth: React.FC<ClerkGoogleAuthProps> = ({ onSuccess }) => {
  const { colors } = useTheme();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { isSignedIn } = useAuth();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(false);

  // 로그인 상태 변경 감지
  useEffect(() => {
    if (isSignedIn) {
      console.log('✅ Clerk 인증 완료, 홈 화면으로 이동');
      onSuccess();
    }
  }, [isSignedIn, onSuccess]);

  /**
   * Google OAuth 시작
   */
  const handleGoogleOAuth = async () => {
    setIsLoading(true);
    console.log('🚀 Clerk Google OAuth 시작 (개선된 버전)');

    try {
      // OAuth 플로우 시작
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow();
      
      console.log('📊 OAuth 결과:', {
        hasSession: !!createdSessionId,
        hasSignIn: !!signIn,
        hasSignUp: !!signUp,
        hasSetActive: !!setActive
      });

      if (createdSessionId && setActive) {
        console.log('✅ 세션 생성 성공');
        
        // 세션 활성화
        await setActive({ session: createdSessionId });
        
        // 사용자 정보 설정
        const userInfo = signIn || signUp;
        if (userInfo) {
          const userData = {
            id: userInfo.id,
            email: userInfo.emailAddress || '',
            nickname: `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || '사용자',
            isVerified: true,
            profileImageUrl: userInfo.imageUrl,
            createdAt: new Date(),
            updatedAt: new Date(),
            currentMode: 'DATING' as any,
          };
          
          setUser(userData);
          console.log('✅ 사용자 정보 저장 완료');
        }
        
        // 성공 콜백 호출
        onSuccess();
      } else {
        console.log('⚠️ 세션 생성 실패 - Cloudflare 문제일 가능성');
        
        Alert.alert(
          '로그인 문제',
          'Google 인증은 성공했지만 세션 생성에 실패했습니다.\n\nClerk Dashboard에서 다음을 확인해주세요:\n1. Google OAuth 설정\n2. Redirect URLs 설정\n3. Development instance 설정',
          [{ text: '확인' }]
        );
      }
    } catch (error: any) {
      console.error('❌ OAuth 오류:', error);
      
      Alert.alert(
        '로그인 오류',
        error?.message || '알 수 없는 오류가 발생했습니다.',
        [{ text: '확인' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.PRIMARY }]}
      onPress={handleGoogleOAuth}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={[styles.buttonText, { marginLeft: SPACING.MD }]}>
            로그인 중...
          </Text>
        </>
      ) : (
        <>
          <MaterialCommunityIcons 
            name="google" 
            size={24} 
            color="#FFFFFF" 
          />
          <Text style={[styles.buttonText, { marginLeft: SPACING.MD }]}>
            Google로 시작하기
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    borderRadius: 12,
    marginVertical: SPACING.SM,
  },
  buttonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});