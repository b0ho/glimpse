import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useAuth } from '@/hooks/useDevAuth';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';
import { COLORS, SPACING, TYPOGRAPHY } from '@/utils/constants';
import { useAuthStore } from '@/store/slices/authSlice';
import { authService } from '@/services/api/authService';
import { ServerConnectionError } from '@/components/ServerConnectionError';

interface DeletionStatus {
  isScheduledForDeletion: boolean;
  deletionRequestedAt?: string;
  scheduledDeletionAt?: string;
  daysRemaining?: number;
  reason?: string;
}

export const AccountRestoreScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { t } = useAndroidSafeTranslation(['settings', 'common']);
  const { colors } = useTheme();
  
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [serverConnectionError, setServerConnectionError] = useState(false);
  
  useEffect(() => {
    fetchDeletionStatus();
  }, []);

  const fetchDeletionStatus = async () => {
    setIsLoading(true);
    setServerConnectionError(false);
    try {
      // TODO: 실제 API 호출로 대체 필요
      // const response = await authService.getDeletionStatus();
      // setDeletionStatus(response.data);
      
      // 현재는 서버 API가 없으므로 에러 상태 설정
      setDeletionStatus(null);
      setServerConnectionError(true);
    } catch (error) {
      console.error('Failed to fetch deletion status:', error);
      setDeletionStatus(null);
      setServerConnectionError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!deletionStatus) return;

    Alert.alert(
      t('settings:deleteAccount.restore.confirmTitle'),
      t('settings:deleteAccount.restore.confirmMessage'),
      [
        { text: t('common:buttons.cancel'), style: 'cancel' },
        {
          text: t('settings:deleteAccount.restore.confirmButton'),
          style: 'default',
          onPress: handleRestoreConfirmed,
        },
      ]
    );
  };

  const handleRestoreConfirmed = async () => {
    setIsRestoring(true);
    
    try {
      // TODO: 실제 API 호출로 대체 필요
      // await authService.restoreAccount();
      throw new Error('서버 API가 구현되지 않았습니다');
      
      Alert.alert(
        t('settings:deleteAccount.restore.successTitle'),
        t('settings:deleteAccount.restore.successMessage'),
        [
          {
            text: t('common:buttons.confirm'),
            onPress: () => navigation.goBack(),
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Account restore error:', error);
      Alert.alert(
        t('settings:deleteAccount.restore.errorTitle'),
        t('settings:deleteAccount.restore.errorMessage')
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysRemainingColor = (days?: number) => {
    if (!days) return colors.TEXT.LIGHT;
    if (days <= 1) return colors.ERROR;
    if (days <= 3) return colors.WARNING || colors.ERROR;
    return colors.PRIMARY;
  };

  // 서버 연결 에러 시 에러 화면 표시
  if (serverConnectionError) {
    return (
      <ServerConnectionError 
        onRetry={() => {
          setServerConnectionError(false);
          fetchDeletionStatus();
        }}
        message={t('common:errors.loadErrors.accountStatus')}
      />
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text style={[styles.loadingText, { color: colors.TEXT.PRIMARY }]}>
            {t('settings:deleteAccount.loadingStatus')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!deletionStatus?.isScheduledForDeletion) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
        <View style={styles.notScheduledContainer}>
          <Ionicons name="checkmark-circle" size={64} color={colors.SUCCESS || colors.PRIMARY} />
          <Text style={[styles.notScheduledTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('settings:deleteAccount.restore.notScheduledTitle')}
          </Text>
          <Text style={[styles.notScheduledText, { color: colors.TEXT.SECONDARY }]}>
            {t('settings:deleteAccount.restore.notScheduledMessage')}
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.PRIMARY }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backButtonText, { color: colors.TEXT.WHITE }]}>
              {t('common:buttons.back')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBackButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>
          {t('settings:deleteAccount.restore.title')}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 상태 카드 */}
        <View style={[styles.statusCard, { 
          backgroundColor: getDaysRemainingColor(deletionStatus.daysRemaining) + '10',
          borderColor: getDaysRemainingColor(deletionStatus.daysRemaining) + '30'
        }]}>
          <View style={styles.statusIcon}>
            <Ionicons 
              name="hourglass-outline" 
              size={32} 
              color={getDaysRemainingColor(deletionStatus.daysRemaining)} 
            />
          </View>
          
          <Text style={[styles.statusTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('settings:deleteAccount.restore.statusTitle')}
          </Text>
          
          <View style={styles.statusInfo}>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.TEXT.SECONDARY }]}>
                {t('settings:deleteAccount.restore.daysRemaining')}
              </Text>
              <Text style={[styles.statusValue, { 
                color: getDaysRemainingColor(deletionStatus.daysRemaining),
                fontSize: 24,
                fontWeight: 'bold'
              }]}>
                {deletionStatus.daysRemaining}일
              </Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.TEXT.SECONDARY }]}>
                {t('settings:deleteAccount.restore.requestedAt')}
              </Text>
              <Text style={[styles.statusValue, { color: colors.TEXT.PRIMARY }]}>
                {deletionStatus.deletionRequestedAt && formatDate(deletionStatus.deletionRequestedAt)}
              </Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.TEXT.SECONDARY }]}>
                {t('settings:deleteAccount.restore.scheduledAt')}
              </Text>
              <Text style={[styles.statusValue, { color: colors.TEXT.PRIMARY }]}>
                {deletionStatus.scheduledDeletionAt && formatDate(deletionStatus.scheduledDeletionAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* 복구 안내 */}
        <View style={[styles.infoCard, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.infoTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('settings:deleteAccount.restore.infoTitle')}
          </Text>
          
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.SUCCESS || colors.PRIMARY} />
              <Text style={[styles.infoText, { color: colors.TEXT.PRIMARY }]}>
                {t('settings:deleteAccount.restore.info.1')}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.SUCCESS || colors.PRIMARY} />
              <Text style={[styles.infoText, { color: colors.TEXT.PRIMARY }]}>
                {t('settings:deleteAccount.restore.info.2')}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.SUCCESS || colors.PRIMARY} />
              <Text style={[styles.infoText, { color: colors.TEXT.PRIMARY }]}>
                {t('settings:deleteAccount.restore.info.3')}
              </Text>
            </View>
          </View>
        </View>

        {/* 복구 버튼 */}
        <TouchableOpacity
          style={[styles.restoreButton, { backgroundColor: colors.SUCCESS || colors.PRIMARY }]}
          onPress={handleRestore}
          disabled={isRestoring}
        >
          {isRestoring ? (
            <ActivityIndicator size="small" color={colors.TEXT.WHITE} />
          ) : (
            <>
              <Ionicons name="refresh" size={20} color={colors.TEXT.WHITE} />
              <Text style={[styles.restoreButtonText, { color: colors.TEXT.WHITE }]}>
                {t('settings:deleteAccount.restore.button')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* 주의사항 */}
        <View style={[styles.warningCard, { backgroundColor: colors.WARNING_BG || colors.ERROR + '10' }]}>
          <Ionicons name="information-circle" size={24} color={colors.WARNING || colors.ERROR} />
          <Text style={[styles.warningText, { color: colors.TEXT.PRIMARY }]}>
            {t('settings:deleteAccount.restore.warning')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  notScheduledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  notScheduledTitle: {
    ...TYPOGRAPHY.h2,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  notScheduledText: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  backButton: {
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
  },
  backButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerBackButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  statusCard: {
    borderRadius: 12,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  statusIcon: {
    marginBottom: SPACING.md,
  },
  statusTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  statusInfo: {
    width: '100%',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statusLabel: {
    ...TYPOGRAPHY.body,
  },
  statusValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  infoCard: {
    borderRadius: 12,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
  },
  infoTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
  },
  infoList: {
    gap: SPACING.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  infoText: {
    ...TYPOGRAPHY.body,
    flex: 1,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: SPACING.md,
    marginTop: SPACING.xl,
    gap: SPACING.xs,
  },
  restoreButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  warningText: {
    ...TYPOGRAPHY.body,
    flex: 1,
  },
});