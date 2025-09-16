/**
 * Welcome 화면 컴포넌트
 */

import React from 'react';
import { View, Text TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { shadowStyles } from '@/utils/shadowStyles';
import { ClerkGoogleAuth } from '@/components/auth/ClerkGoogleAuth';
import { QuickDevUser } from '@/types/auth.types';
import { isDevelopment } from '@/config/dev.config';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

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
    <View className="container">
      <View className="logoContainer">
        <Text className="title">
          {t('welcome.title')}
        </Text>
        <Text className="subtitle">
          {t('welcome.subtitle')}
        </Text>
      </View>
      
      <View className="authButtonsContainer">
        {/* 구글 로그인 버튼 */}
        <TouchableOpacity
          className="googleButton"
          onPress={onGoogleLogin}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <ActivityIndicator size="small" color="#4285F4" />
          ) : (
            <>
              <MaterialCommunityIcons 
                name="google" 
                size={20} 
                color="#4285F4" 
              />
              <Text className="googleButtonText">
                {t('welcome.continueWithGoogle')}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        {/* 전화번호 로그인 버튼 - 모든 환경에서 표시 */}
        <TouchableOpacity
          className="authButton"
          onPress={onSignInMode}
        >
          <MaterialCommunityIcons 
            name="phone" 
            size={20} 
            color="#fff" 
          />
          <Text className="authButtonText">
            {t('welcome.loginWithPhone')}
          </Text>
        </TouchableOpacity>
        
        {/* 회원가입 버튼 */}
        <TouchableOpacity
          className="authButton"
          onPress={onSignUpMode}
        >
          <MaterialCommunityIcons 
            name="account-plus" 
            size={20} 
            color={colors.TEXT.PRIMARY} 
          />
          <Text className="authButtonText">
            {t('welcome.signUpWithPhone')}
          </Text>
        </TouchableOpacity>
        
        {/* 또는 구분선 */}
        <View className="dividerContainer">
          <View className="divider" />
          <Text className="dividerText">
            또는
          </Text>
          <View className="divider" />
        </View>
        
        {/* Clerk 전화번호 인증 버튼 (신규) */}
        <TouchableOpacity
          className="authButton"
          onPress={onSignUpMode}
        >
          <MaterialCommunityIcons 
            name="message-text" 
            size={20} 
            color="#fff" 
          />
          <Text className="authButtonText">
            SMS로 빠른 시작
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* 개발 환경 빠른 로그인 */}
      {__DEV__ && isDevelopment && (
        <View className="devSection">
          <Text className="devTitle">
            🔧 개발 환경 빠른 로그인
          </Text>
          <View className="quickLoginGrid">
            {quickDevUsers.map((user) => (
              <TouchableOpacity
                key={user.id}
                className="quickLoginButton"
                onPress={() => onQuickDevLogin(user)}
              >
                <Text className="quickLoginText">
                  {user.nickname}
                </Text>
                {user.isPremium && (
                  <Text className="premiumBadge">
                    ⭐
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          {/* 온보딩 초기화 버튼 */}
          {onResetOnboarding && (
            <TouchableOpacity
              className="resetButton"
              onPress={onResetOnboarding}
            >
              <Text className="resetButtonText">
                🔄 온보딩 초기화
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {/* 약관 동의 문구 */}
      <View className="termsContainer">
        <Text className="termsTextSimple">
          로그인 시 개인정보처리방침과 서비스 이용약관에 동의하게 됩니다.
        </Text>
      </View>
    </View>
  );
};

