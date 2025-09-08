/**
 * Welcome 화면 컴포넌트
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { shadowStyles } from '@/utils/shadowStyles';
import { ClerkGoogleAuth } from '@/components/auth/ClerkGoogleAuth';
import { QuickDevUser } from '@/types/auth.types';
import { isDevelopment } from '@/config/dev.config';

interface WelcomeScreenProps {
  onSignInMode: () => void;
  onSignUpMode: () => void;
  onGoogleLogin: () => Promise<void>;
  onQuickDevLogin: (user: QuickDevUser) => void;
  onResetOnboarding?: () => Promise<void>;
  isGoogleLoading: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSignInMode,
  onSignUpMode,
  onGoogleLogin,
  onQuickDevLogin,
  onResetOnboarding,
  isGoogleLoading,
}) => {
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation('auth');
  
  /**
   * 빠른 개발 로그인 사용자 목록
   */
  const quickDevUsers: QuickDevUser[] = [
    {
      id: 'user1',
      nickname: '김철수',
      profileImageUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
      isPremium: false,
    },
    {
      id: 'user2',
      nickname: '이영희',
      profileImageUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
      isPremium: true,
    },
    {
      id: 'user3',
      nickname: '박민수',
      profileImageUrl: 'https://randomuser.me/api/portraits/men/3.jpg',
      isPremium: false,
    },
    {
      id: 'user4',
      nickname: '최지연',
      profileImageUrl: 'https://randomuser.me/api/portraits/women/4.jpg',
      isPremium: true,
    },
  ];
  
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={[styles.title, { color: colors.TEXT.PRIMARY }]}>
          {t('welcome.title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.TEXT.SECONDARY }]}>
          {t('welcome.subtitle')}
        </Text>
      </View>
      
      <View style={styles.authButtonsContainer}>
        {/* 구글 로그인 버튼 */}
        <TouchableOpacity
          style={[styles.googleButton, { backgroundColor: '#fff' }]}
          onPress={onGoogleLogin}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <ActivityIndicator size="small" color="#4285F4" />
          ) : (
            <>
              <ClerkGoogleAuth onSuccess={onGoogleLogin} />
              <Text style={[styles.googleButtonText, { color: '#4285F4' }]}>
                {t('welcome.continueWithGoogle')}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        {/* 전화번호 로그인 버튼 - 개발 환경에서만 표시 */}
        {isDevelopment && (
          <>
            <TouchableOpacity
              style={[styles.authButton, { backgroundColor: colors.PRIMARY }]}
              onPress={onSignInMode}
            >
              <Text style={[styles.authButtonText, { color: '#fff' }]}>
                {t('welcome.loginWithPhone')}
              </Text>
            </TouchableOpacity>
            
            {/* 회원가입 버튼 */}
            <TouchableOpacity
              style={[styles.authButton, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER, borderWidth: 1 }]}
              onPress={onSignUpMode}
            >
              <Text style={[styles.authButtonText, { color: colors.TEXT.PRIMARY }]}>
                {t('welcome.signUpWithPhone')}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      
      {/* 개발 환경 빠른 로그인 */}
      {__DEV__ && isDevelopment && (
        <View style={styles.devSection}>
          <Text style={[styles.devTitle, { color: colors.TEXT.SECONDARY }]}>
            🔧 개발 환경 빠른 로그인
          </Text>
          <View style={styles.quickLoginGrid}>
            {quickDevUsers.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={[styles.quickLoginButton, { backgroundColor: colors.SURFACE }]}
                onPress={() => onQuickDevLogin(user)}
              >
                <Text style={[styles.quickLoginText, { color: colors.TEXT.PRIMARY }]}>
                  {user.nickname}
                </Text>
                {user.isPremium && (
                  <Text style={[styles.premiumBadge, { color: colors.WARNING }]}>
                    ⭐
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          {/* 온보딩 초기화 버튼 */}
          {onResetOnboarding && (
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: colors.ERROR + '20' }]}
              onPress={onResetOnboarding}
            >
              <Text style={[styles.resetButtonText, { color: colors.ERROR }]}>
                🔄 온보딩 초기화
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {/* 약관 동의 문구 */}
      <View style={styles.termsContainer}>
        <Text style={[styles.termsTextSimple, { color: colors.TEXT.TERTIARY }]}>
          로그인 시 개인정보처리방침과 서비스 이용약관에 동의하게 됩니다.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.LG,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.XL * 2,
  },
  title: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    marginBottom: SPACING.SM,
  },
  subtitle: {
    fontSize: FONT_SIZES.MD,
    textAlign: 'center',
  },
  authButtonsContainer: {
    gap: SPACING.MD,
    marginBottom: SPACING.XL,
  },
  authButton: {
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    borderRadius: 12,
    alignItems: 'center',
  },
  authButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowStyles.small,
  },
  googleButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    marginLeft: SPACING.SM,
  },
  devSection: {
    paddingVertical: SPACING.LG,
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
  devTitle: {
    fontSize: FONT_SIZES.SM,
    textAlign: 'center',
    marginBottom: SPACING.MD,
  },
  quickLoginGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
    justifyContent: 'center',
  },
  quickLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: 8,
  },
  quickLoginText: {
    fontSize: FONT_SIZES.SM,
  },
  premiumBadge: {
    marginLeft: SPACING.XS,
  },
  resetButton: {
    marginTop: SPACING.MD,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  termsContainer: {
    marginTop: SPACING.XL,
    alignItems: 'center',
  },
  termsText: {
    fontSize: FONT_SIZES.XS,
    textAlign: 'center',
  },
  termsLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termsLink: {
    fontSize: FONT_SIZES.XS,
    textDecorationLine: 'underline',
  },
  termsTextSimple: {
    fontSize: FONT_SIZES.XS,
    textAlign: 'center',
    lineHeight: 18,
  },
});