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
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { SUPER_ACCOUNTS, isAuthBypassEnabled, DEV_CONFIG } from '@/config/dev.config';
import { SPACING, FONT_SIZES } from '@/utils/constants';
import { useTheme } from '@/hooks/useTheme';

export const DevModePanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation(['common', 'dev']);
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
        { text: t('actions.cancel', { ns: 'common' }), style: 'cancel' },
        {
          text: t('actions.switch', { ns: 'common' }),
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
        style={[styles.toggleButton, { backgroundColor: colors.WARNING }]}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={[styles.toggleText, { color: colors.TEXT.WHITE }]}>
          🛠️ Dev Mode ({currentAccount?.nickname})
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={[styles.panel, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.title, { color: colors.TEXT.PRIMARY }]}>{t('devModePanel', { ns: 'dev' })}</Text>
          
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>{t('currentAccount', { ns: 'dev' })}</Text>
            <Text style={[styles.info, { color: colors.TEXT.SECONDARY }]}>{t('type', { ns: 'dev' })}: {currentAccountType}</Text>
            <Text style={[styles.info, { color: colors.TEXT.SECONDARY }]}>{t('email', { ns: 'dev' })}: {currentAccount?.email}</Text>
            <Text style={[styles.info, { color: colors.TEXT.SECONDARY }]}>{t('premium', { ns: 'dev' })}: {currentAccount?.isPremium ? 'Yes' : 'No'}</Text>
            <Text style={[styles.info, { color: colors.TEXT.SECONDARY }]}>{t('admin', { ns: 'dev' })}: {currentAccount?.isAdmin ? 'Yes' : 'No'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>{t('accountSwitch', { ns: 'dev' })}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Object.entries(SUPER_ACCOUNTS).map(([type, account]) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.accountButton,
                    { backgroundColor: colors.BACKGROUND },
                    currentAccountType === type && { backgroundColor: colors.PRIMARY },
                  ]}
                  onPress={() => handleAccountSwitch(type)}
                >
                  <Text style={[styles.accountButtonText, { color: colors.TEXT.PRIMARY }]}>
                    {account.nickname}
                  </Text>
                  <Text style={[styles.accountButtonSubtext, { color: colors.TEXT.SECONDARY }]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>{t('debugInfo', { ns: 'dev' })}</Text>
            <Text style={[styles.info, { color: colors.TEXT.SECONDARY }]}>{t('environment', { ns: 'dev' })}: development</Text>
            <Text style={[styles.info, { color: colors.TEXT.SECONDARY }]}>API: http://localhost:3001/api/v1</Text>
            <Text style={[styles.info, { color: colors.TEXT.SECONDARY }]}>{t('mockApi', { ns: 'dev' })}: {DEV_CONFIG.mockApiCalls ? 'ON' : 'OFF'}</Text>
          </View>

          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.ERROR }]}
            onPress={() => setIsExpanded(false)}
          >
            <Text style={[styles.closeButtonText, { color: colors.TEXT.WHITE }]}>{t('actions.close', { ns: 'common' })}</Text>
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
    fontSize: FONT_SIZES.SM,
    fontWeight: 'bold',
  },
  panel: {
    position: 'absolute',
    bottom: 50,
    right: 0,
    width: 300,
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
  },
  section: {
    marginBottom: SPACING.MD,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    marginBottom: SPACING.SM,
  },
  info: {
    fontSize: FONT_SIZES.SM,
    marginBottom: 2,
  },
  accountButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
    marginRight: SPACING.SM,
    alignItems: 'center',
  },
  accountButtonActive: {},
  accountButtonText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  accountButtonSubtext: {
    fontSize: FONT_SIZES.XS,
    marginTop: 2,
  },
  closeButton: {
    paddingVertical: SPACING.SM,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.SM,
  },
  closeButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
});