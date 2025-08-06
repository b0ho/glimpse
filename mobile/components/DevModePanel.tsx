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
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '@/hooks/useDevAuth';
import { SUPER_ACCOUNTS, isAuthBypassEnabled, DEV_CONFIG } from '@/config/dev.config';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

export const DevModePanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const auth = useAuth();

  if (!isAuthBypassEnabled) return null;

  const currentAccount = auth.user;
  const currentAccountType = Object.entries(SUPER_ACCOUNTS).find(
    ([_, account]) => account.id === currentAccount?.id
  )?.[0] || 'unknown';

  const handleAccountSwitch = (accountType: string) => {
    Alert.alert(
      '계정 전환',
      `${SUPER_ACCOUNTS[accountType].nickname} 계정으로 전환하시겠습니까?\n앱이 새로고침됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '전환',
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

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.toggleText}>
          🛠️ Dev Mode ({currentAccount?.nickname})
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.panel}>
          <Text style={styles.title}>개발 모드 패널</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>현재 계정</Text>
            <Text style={styles.info}>타입: {currentAccountType}</Text>
            <Text style={styles.info}>이메일: {currentAccount?.email}</Text>
            <Text style={styles.info}>프리미엄: {currentAccount?.isPremium ? 'Yes' : 'No'}</Text>
            <Text style={styles.info}>관리자: {currentAccount?.isAdmin ? 'Yes' : 'No'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>계정 전환</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Object.entries(SUPER_ACCOUNTS).map(([type, account]) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.accountButton,
                    currentAccountType === type && styles.accountButtonActive,
                  ]}
                  onPress={() => handleAccountSwitch(type)}
                >
                  <Text style={styles.accountButtonText}>
                    {account.nickname}
                  </Text>
                  <Text style={styles.accountButtonSubtext}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>디버그 정보</Text>
            <Text style={styles.info}>환경: development</Text>
            <Text style={styles.info}>API: http://localhost:3001/api/v1</Text>
            <Text style={styles.info}>Mock API: {DEV_CONFIG.mockApiCalls ? 'ON' : 'OFF'}</Text>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsExpanded(false)}
          >
            <Text style={styles.closeButtonText}>닫기</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 9999,
  },
  toggleButton: {
    backgroundColor: COLORS.WARNING,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toggleText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.SM,
    fontWeight: 'bold',
  },
  panel: {
    position: 'absolute',
    bottom: 50,
    right: 0,
    width: 300,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 10,
    padding: SPACING.MD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    marginBottom: SPACING.MD,
    color: COLORS.TEXT.PRIMARY,
  },
  section: {
    marginBottom: SPACING.MD,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    marginBottom: SPACING.SM,
    color: COLORS.TEXT.PRIMARY,
  },
  info: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 2,
  },
  accountButton: {
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
    marginRight: SPACING.SM,
    alignItems: 'center',
  },
  accountButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  accountButtonText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  accountButtonSubtext: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 2,
  },
  closeButton: {
    backgroundColor: COLORS.ERROR,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.SM,
  },
  closeButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
});