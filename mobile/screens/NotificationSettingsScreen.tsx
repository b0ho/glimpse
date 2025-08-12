import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootNavigationParamList } from '@/navigation/AppNavigator';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNotificationStore } from '@/store/slices/notificationSlice';
import { usePremiumStore, premiumSelectors } from '@/store/slices/premiumSlice';
import { useAuthStore } from '@/store/slices/authSlice';
import { COLORS, SPACING, TYPOGRAPHY } from '@/utils/constants/index';
import { fcmService } from '@/services/notifications/fcmService';
import { AppMode, MODE_TEXTS } from '@shared/types';
import { useTranslation } from 'react-i18next';

interface SettingItemProps {
  title: string;
  description?: string;
  value: boolean;
  onToggle: () => void;
  disabled?: boolean;
  isPremiumFeature?: boolean;
}

function SettingItem({
  title,
  description,
  value,
  onToggle,
  disabled = false,
  isPremiumFeature = false,
}: SettingItemProps) {
  const isPremium = usePremiumStore(premiumSelectors.isPremiumUser());
  const navigation = useNavigation<NavigationProp<RootNavigationParamList>>();
  const { t } = useTranslation(['settings', 'common']);

  const handleToggle = () => {
    if (isPremiumFeature && !isPremium) {
      Alert.alert(
        t('settings:notificationSettings.alerts.premiumFeature'),
        t('settings:notificationSettings.alerts.premiumFeatureDescription'),
        [
          { text: t('common:cancel'), style: 'cancel' },
          {
            text: t('settings:notificationSettings.alerts.upgrade'),
            onPress: () => navigation.navigate('Premium'),
          },
        ]
      );
      return;
    }
    
    if (!disabled) {
      onToggle();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.settingItem, disabled && styles.disabledItem]}
      onPress={handleToggle}
      disabled={disabled}
    >
      <View style={styles.settingContent}>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>
            {title}
            {isPremiumFeature && !isPremium && (
              <Ionicons name="diamond" size={14} color={COLORS.premium} />
            )}
          </Text>
          {description && (
            <Text style={styles.settingDescription}>{description}</Text>
          )}
        </View>
        <Switch
          value={value && (!isPremiumFeature || isPremium)}
          onValueChange={handleToggle}
          disabled={disabled || (isPremiumFeature && !isPremium)}
          trackColor={{
            false: COLORS.gray300,
            true: COLORS.primary + '40',
          }}
          thumbColor={value ? COLORS.primary : COLORS.gray500}
        />
      </View>
    </TouchableOpacity>
  );
}

export function NotificationSettingsScreen() {
  const navigation = useNavigation<NavigationProp<RootNavigationParamList>>();
  const { currentMode } = useAuthStore();
  const { t } = useTranslation(['settings', 'common']);
  const {
    settings,
    isInitialized,
    toggleNotificationType,
    resetSettings,
    sendTestNotification,
    initializeNotifications,
  } = useNotificationStore();

  const isPremium = usePremiumStore(premiumSelectors.isPremiumUser());
  const modeTexts = MODE_TEXTS[currentMode || AppMode.DATING];

  React.useEffect(() => {
    if (!isInitialized) {
      initializeNotifications();
    }
  }, [isInitialized, initializeNotifications]);

  // Initialize FCM when push is enabled
  React.useEffect(() => {
    if (settings.pushEnabled) {
      fcmService.initialize();
    }
  }, [settings.pushEnabled]);

  const handleSendTestNotification = async () => {
    try {
      await sendTestNotification();
      Alert.alert(t('settings:notificationSettings.alerts.testComplete'), t('settings:notificationSettings.alerts.testCompleteDescription'));
    } catch {
      Alert.alert(t('common:error'), t('settings:notificationSettings.alerts.testFailed'));
    }
  };

  const handleResetNotifications = () => {
    Alert.alert(
      t('settings:notificationSettings.alerts.resetTitle'),
      t('settings:notificationSettings.alerts.resetDescription'),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('common:reset'),
          style: 'destructive',
          onPress: async () => {
            try {
              await resetSettings();
              Alert.alert(t('common:done'), t('settings:notificationSettings.alerts.resetComplete'));
            } catch {
              Alert.alert(t('common:error'), t('settings:notificationSettings.alerts.resetFailed'));
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings:notificationSettings.title')}</Text>
        <TouchableOpacity onPress={handleResetNotifications}>
          <Text style={styles.resetButton}>{t('common:reset')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 전체 알림 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings:notificationSettings.globalSettings.title')}</Text>
          <SettingItem
            title={t('settings:notificationSettings.globalSettings.pushNotifications')}
            description={t('settings:notificationSettings.globalSettings.pushNotificationsDescription')}
            value={settings.pushEnabled}
            onToggle={() => toggleNotificationType('pushEnabled')}
          />
        </View>

        {/* 매치 관련 알림 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t(`settings:notificationSettings.matchSettings.title${currentMode === AppMode.DATING ? '' : 'Friendship'}`)}
          </Text>
          <SettingItem
            title={t(`settings:notificationSettings.matchSettings.newMatch${currentMode === AppMode.DATING ? '' : 'Friendship'}`)}
            description={
              t(`settings:notificationSettings.matchSettings.newMatch${currentMode === AppMode.DATING ? '' : 'Friendship'}Description`)
            }
            value={settings.newMatches}
            onToggle={() => toggleNotificationType('newMatches')}
            disabled={!settings.pushEnabled}
          />
          <View style={styles.separator} />
          <SettingItem
            title={t(`settings:notificationSettings.matchSettings.likesReceived${currentMode === AppMode.DATING ? '' : 'Friendship'}`)}
            description={
              t(`settings:notificationSettings.matchSettings.likesReceived${currentMode === AppMode.DATING ? '' : 'Friendship'}Description`)
            }
            value={settings.likesReceived}
            onToggle={() => toggleNotificationType('likesReceived')}
            disabled={!settings.pushEnabled}
            isPremiumFeature={true}
          />
          {currentMode === AppMode.DATING && (
            <>
              <View style={styles.separator} />
              <SettingItem
                title={t('settings:notificationSettings.matchSettings.superLikes')}
                description={t('settings:notificationSettings.matchSettings.superLikesDescription')}
                value={settings.superLikes}
                onToggle={() => toggleNotificationType('superLikes')}
                disabled={!settings.pushEnabled}
              />
            </>
          )}
        </View>

        {/* 메시지 관련 알림 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings:notificationSettings.messageSettings.title')}</Text>
          <SettingItem
            title={t('settings:notificationSettings.messageSettings.newMessage')}
            description={t('settings:notificationSettings.messageSettings.newMessageDescription')}
            value={settings.newMessages}
            onToggle={() => toggleNotificationType('newMessages')}
            disabled={!settings.pushEnabled}
          />
        </View>

        {/* 그룹 관련 알림 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings:notificationSettings.groupSettings.title')}</Text>
          <SettingItem
            title={t('settings:notificationSettings.groupSettings.groupInvites')}
            description={t('settings:notificationSettings.groupSettings.groupInvitesDescription')}
            value={settings.groupInvites}
            onToggle={() => toggleNotificationType('groupInvites')}
            disabled={!settings.pushEnabled}
          />
        </View>

        {/* 프리미엄 안내 */}
        {!isPremium && (
          <View style={styles.premiumSection}>
            <View style={styles.premiumCard}>
              <Ionicons name="diamond" size={24} color={COLORS.premium} />
              <Text style={styles.premiumTitle}>{t('settings:notificationSettings.premium.title')}</Text>
              <Text style={styles.premiumDescription}>
                {t('settings:notificationSettings.premium.description')}
              </Text>
              <TouchableOpacity
                style={styles.premiumButton}
                onPress={() => navigation.navigate('Premium')}
              >
                <Text style={styles.premiumButtonText}>{t('settings:notificationSettings.premium.viewPremium')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 테스트 알림 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings:notificationSettings.test.title')}</Text>
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleSendTestNotification}
            disabled={!settings.pushEnabled || !isInitialized}
          >
            <Ionicons name="notifications" size={20} color={COLORS.primary} />
            <Text style={styles.testButtonText}>{t('settings:notificationSettings.test.sendNotification')}</Text>
          </TouchableOpacity>
        </View>

        {/* 알림 설정 안내 */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>{t('settings:notificationSettings.info.title')}</Text>
          <Text style={styles.infoText}>
            {t('settings:notificationSettings.info.deviceSettings')}
          </Text>
          <Text style={styles.infoText}>
            {t('settings:notificationSettings.info.batterySaver')}
          </Text>
          <Text style={styles.infoText}>
            {t('settings:notificationSettings.info.appClosed')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  resetButton: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  settingItem: {
    paddingVertical: SPACING.sm,
  },
  disabledItem: {
    opacity: 0.5,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingText: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '500',
  },
  settingDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: SPACING.sm,
  },
  premiumSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  premiumCard: {
    backgroundColor: COLORS.premium + '10',
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.premium + '20',
  },
  premiumTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  premiumDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  premiumButton: {
    backgroundColor: COLORS.premium,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  premiumButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.white,
    fontWeight: '600',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  testButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: SPACING.sm,
  },
  infoSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.gray50,
  },
  infoTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  infoText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    lineHeight: 18,
  },
});