/**
 * 개발 모드 패널 컴포넌트
 * @module components/DevModePanel
 * @description 개발 환경에서 슈퍼 계정 전환 및 디버그 기능 제공
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useAuth } from '@/hooks/useAuth';
import { SUPER_ACCOUNTS, isAuthBypassEnabled, DEV_CONFIG } from '@/config/dev.config';
import { SPACING, FONT_SIZES } from '@/utils/constants';
import { useTheme } from '@/hooks/useTheme';

export const DevModePanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useAndroidSafeTranslation('common');
  const auth = useAuth();
  const { colors } = useTheme();

  if (!isAuthBypassEnabled) return null;

  const currentAccount = auth.user;
  const currentAccountType = Object.entries(SUPER_ACCOUNTS).find(
    ([_, account]) => account.id === currentAccount?.id
  )?.[0] || 'unknown';

  const handleAccountSwitch = (accountType: string) => {
    Alert.alert(
      t('accountSwitch', { ns: 'dev' }),
      t('switchAccount', { nickname: SUPER_ACCOUNTS[accountType].nickname, ns: 'dev' }),
      [
        { text: t('actions:actions.cancel', { ns: 'common' }), style: 'cancel' },
        {
          text: t('actions:actions.switch', { ns: 'common' }),
          onPress: () => {
            // 환경변수를 동적으로 변경할 수 없으므로 로컬 스토리지 사용
            if (typeof window !== 'undefined') {
              window.localStorage.setItem('DEV_ACCOUNT_TYPE', accountType);
              window.location.reload();
            }
          },
        },
      ]
    );
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      '온보딩 초기화',
      '온보딩을 다시 볼 수 있게 초기화하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@glimpse_onboarding_completed');
              Alert.alert('완료', '온보딩이 초기화되었습니다. 앱을 재시작하면 온보딩을 다시 볼 수 있습니다.');
            } catch (error) {
              Alert.alert('오류', '온보딩 초기화에 실패했습니다.');
              console.error('Failed to reset onboarding:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="container">
      <TouchableOpacity
        className="toggleButton"
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text className="toggleText">
          🛠️ Dev Mode ({currentAccount?.nickname})
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View className="panel">
          <Text className="title">{t('devModePanel', { ns: 'dev' })}</Text>
          
          <View className="section">
            <Text className="sectionTitle">{t('currentAccount', { ns: 'dev' })}</Text>
            <Text className="info">{t('type', { ns: 'dev' })}: {currentAccountType}</Text>
            <Text className="info">{t('email', { ns: 'dev' })}: {currentAccount?.email}</Text>
            <Text className="info">{t('premium', { ns: 'dev' })}: {currentAccount?.isPremium ? 'Yes' : 'No'}</Text>
            <Text className="info">{t('admin', { ns: 'dev' })}: {currentAccount?.isAdmin ? 'Yes' : 'No'}</Text>
          </View>

          <View className="section">
            <Text className="sectionTitle">{t('accountSwitch', { ns: 'dev' })}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Object.entries(SUPER_ACCOUNTS).map(([type, account]) => (
                <TouchableOpacity
                  key={type}
                  className="accountButton"
                  onPress={() => handleAccountSwitch(type)}
                >
                  <Text className="accountButtonText">
                    {account.nickname}
                  </Text>
                  <Text className="accountButtonSubtext">
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View className="section">
            <Text className="sectionTitle">{t('debugInfo', { ns: 'dev' })}</Text>
            <Text className="info">{t('environment', { ns: 'dev' })}: development</Text>
            <Text className="info">API: http://localhost:3001/api/v1</Text>
            <Text className="info">{t('mockApi', { ns: 'dev' })}: {DEV_CONFIG.mockApiCalls ? 'ON' : 'OFF'}</Text>
          </View>

          <View className="section">
            <TouchableOpacity
              className="resetButton"
              onPress={handleResetOnboarding}
            >
              <Text className="resetButtonText">🔄 온보딩 초기화</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="closeButton"
            onPress={() => setIsExpanded(false)}
          >
            <Text className="closeButtonText">{t('actions:actions.close', { ns: 'common' })}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

