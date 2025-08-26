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
import { useTheme } from '@/hooks/useTheme';
import { COLORS, SPACING, TYPOGRAPHY } from '@/utils/constants/index';
import { fcmService } from '@/services/notifications/fcmService';
import { AppMode, MODE_TEXTS } from '../shared/types';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';

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
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation('settings');

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
          <Text style={[styles.settingTitle, { color: colors.TEXT.PRIMARY }]}>
            {title}
            {isPremiumFeature && !isPremium && (
              <Ionicons name="diamond" size={14} color={colors.premium} />
            )}
          </Text>
          {description && (
            <Text style={[styles.settingDescription, { color: colors.TEXT.SECONDARY }]}>{description}</Text>
          )}
        </View>
        <Switch
          value={value && (!isPremiumFeature || isPremium)}
          onValueChange={handleToggle}
          disabled={disabled || (isPremiumFeature && !isPremium)}
          trackColor={{
            false: colors.gray300 || '#DEE2E6',
            true: colors.primary + '40',
          }}
          thumbColor={value ? colors.primary : colors.gray500 || '#ADB5BD'}
        />
      </View>
    </TouchableOpacity>
  );
}

export function NotificationSettingsScreen() {
  const navigation = useNavigation<NavigationProp<RootNavigationParamList>>();
  const { currentMode } = useAuthStore();
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation('settings');
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={[styles.header, { borderBottomColor: colors.BORDER }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>{t('settings:notificationSettings.title')}</Text>
        <TouchableOpacity onPress={handleResetNotifications}>
          <Text style={[styles.resetButton, { color: colors.PRIMARY }]}>{t('common:reset')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 전체 알림 설정 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>{t('settings:notificationSettings.globalSettings.title')}</Text>
          <SettingItem
            title={t('settings:notificationSettings.globalSettings.pushNotifications')}
            description={t('settings:notificationSettings.globalSettings.pushNotificationsDescription')}
            value={settings.pushEnabled}
            onToggle={() => toggleNotificationType('pushEnabled')}
          />
        </View>

        {/* 매치 관련 알림 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
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
          <View style={[styles.separator, { backgroundColor: colors.BORDER }]} />
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
              <View style={[styles.separator, { backgroundColor: colors.BORDER }]} />
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
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>{t('settings:notificationSettings.messageSettings.title')}</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>{t('settings:notificationSettings.groupSettings.title')}</Text>
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
            <View style={[styles.premiumCard, { backgroundColor: colors.premium + '10', borderColor: colors.premium + '20' }]}>
              <Ionicons name="diamond" size={24} color={colors.premium} />
              <Text style={[styles.premiumTitle, { color: colors.TEXT.PRIMARY }]}>{t('settings:notificationSettings.premium.title')}</Text>
              <Text style={[styles.premiumDescription, { color: colors.TEXT.SECONDARY }]}>
                {t('settings:notificationSettings.premium.description')}
              </Text>
              <TouchableOpacity
                style={[styles.premiumButton, { backgroundColor: colors.premium }]}
                onPress={() => navigation.navigate('Premium')}
              >
                <Text style={[styles.premiumButtonText, { color: colors.TEXT.WHITE }]}>{t('settings:notificationSettings.premium.viewPremium')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 테스트 알림 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>{t('settings:notificationSettings.test.title')}</Text>
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.PRIMARY + '10', borderColor: colors.PRIMARY + '20' }]}
            onPress={handleSendTestNotification}
            disabled={!settings.pushEnabled || !isInitialized}
          >
            <Ionicons name="notifications" size={20} color={colors.PRIMARY} />
            <Text style={[styles.testButtonText, { color: colors.PRIMARY }]}>{t('settings:notificationSettings.test.sendNotification')}</Text>
          </TouchableOpacity>
        </View>

        {/* 알림 설정 안내 */}
        <View style={[styles.infoSection, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.infoTitle, { color: colors.TEXT.PRIMARY }]}>{t('settings:notificationSettings.info.title')}</Text>
          <Text style={[styles.infoText, { color: colors.TEXT.SECONDARY }]}>
            {t('settings:notificationSettings.info.deviceSettings')}
          </Text>
          <Text style={[styles.infoText, { color: colors.TEXT.SECONDARY }]}>
            {t('settings:notificationSettings.info.batterySaver')}
          </Text>
          <Text style={[styles.infoText, { color: colors.TEXT.SECONDARY }]}>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
  },
  resetButton: {
    ...TYPOGRAPHY.bodySmall,
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
    fontWeight: '500',
  },
  settingDescription: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.xs,
  },
  separator: {
    height: 1,
    marginVertical: SPACING.sm,
  },
  premiumSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  premiumCard: {
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  premiumTitle: {
    ...TYPOGRAPHY.h3,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  premiumDescription: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  premiumButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  premiumButtonText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    borderWidth: 1,
  },
  testButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    marginLeft: SPACING.sm,
  },
  infoSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  infoTitle: {
    ...TYPOGRAPHY.h4,
    marginBottom: SPACING.sm,
  },
  infoText: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.xs,
    lineHeight: 18,
  },
});