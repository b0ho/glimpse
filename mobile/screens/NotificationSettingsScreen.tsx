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
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '@/store/slices/notificationSlice';
import { usePremiumStore, premiumSelectors } from '@/store/slices/premiumSlice';
import { COLORS, SPACING, TYPOGRAPHY } from '@/utils/constants/index';
import { fcmService } from '@/services/notifications/fcmService';

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

  const handleToggle = () => {
    if (isPremiumFeature && !isPremium) {
      Alert.alert(
        '프리미엄 기능',
        '이 기능은 프리미엄 사용자만 이용할 수 있습니다. 프리미엄으로 업그레이드하시겠어요?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '업그레이드',
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

export default function NotificationSettingsScreen() {
  const navigation = useNavigation<NavigationProp<RootNavigationParamList>>();
  const {
    settings,
    isInitialized,
    toggleNotificationType,
    resetSettings,
    sendTestNotification,
    initializeNotifications,
  } = useNotificationStore();

  const isPremium = usePremiumStore(premiumSelectors.isPremiumUser());

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
      Alert.alert('테스트 완료', '테스트 알림이 전송되었습니다!');
    } catch {
      Alert.alert('오류', '테스트 알림 전송에 실패했습니다.');
    }
  };

  const handleResetNotifications = () => {
    Alert.alert(
      '알림 설정 초기화',
      '모든 알림 설정을 기본값으로 초기화하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetSettings();
              Alert.alert('완료', '알림 설정이 초기화되었습니다.');
            } catch {
              Alert.alert('오류', '설정 초기화에 실패했습니다.');
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
        <Text style={styles.headerTitle}>알림 설정</Text>
        <TouchableOpacity onPress={handleResetNotifications}>
          <Text style={styles.resetButton}>초기화</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 전체 알림 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>전체 설정</Text>
          <SettingItem
            title="푸시 알림"
            description="앱에서 보내는 모든 푸시 알림을 활성화합니다"
            value={settings.pushEnabled}
            onToggle={() => toggleNotificationType('pushEnabled')}
          />
        </View>

        {/* 매치 관련 알림 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>매치</Text>
          <SettingItem
            title="새로운 매치"
            description="서로 좋아요를 눌렀을 때 알림을 받습니다"
            value={settings.newMatches}
            onToggle={() => toggleNotificationType('newMatches')}
            disabled={!settings.pushEnabled}
          />
          <View style={styles.separator} />
          <SettingItem
            title="좋아요 받음"
            description="누군가 나에게 좋아요를 보냈을 때 알림을 받습니다"
            value={settings.likesReceived}
            onToggle={() => toggleNotificationType('likesReceived')}
            disabled={!settings.pushEnabled}
            isPremiumFeature={true}
          />
          <View style={styles.separator} />
          <SettingItem
            title="슈퍼 좋아요"
            description="슈퍼 좋아요를 받았을 때 알림을 받습니다"
            value={settings.superLikes}
            onToggle={() => toggleNotificationType('superLikes')}
            disabled={!settings.pushEnabled}
          />
        </View>

        {/* 메시지 관련 알림 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>메시지</Text>
          <SettingItem
            title="새로운 메시지"
            description="매치된 상대로부터 메시지를 받았을 때 알림을 받습니다"
            value={settings.newMessages}
            onToggle={() => toggleNotificationType('newMessages')}
            disabled={!settings.pushEnabled}
          />
        </View>

        {/* 그룹 관련 알림 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>그룹</Text>
          <SettingItem
            title="그룹 초대"
            description="새로운 그룹에 초대받았을 때 알림을 받습니다"
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
              <Text style={styles.premiumTitle}>프리미엄 알림 기능</Text>
              <Text style={styles.premiumDescription}>
                프리미엄으로 업그레이드하면 좋아요 받음 알림과 더 많은 기능을 이용할 수 있어요!
              </Text>
              <TouchableOpacity
                style={styles.premiumButton}
                onPress={() => navigation.navigate('Premium')}
              >
                <Text style={styles.premiumButtonText}>프리미엄 보기</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 테스트 알림 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>테스트</Text>
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleSendTestNotification}
            disabled={!settings.pushEnabled || !isInitialized}
          >
            <Ionicons name="notifications" size={20} color={COLORS.primary} />
            <Text style={styles.testButtonText}>테스트 알림 보내기</Text>
          </TouchableOpacity>
        </View>

        {/* 알림 설정 안내 */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>📱 알림 설정 안내</Text>
          <Text style={styles.infoText}>
            • 알림을 받으려면 기기의 설정에서도 알림을 허용해야 합니다
          </Text>
          <Text style={styles.infoText}>
            • 배터리 절약 모드에서는 알림이 지연될 수 있습니다
          </Text>
          <Text style={styles.infoText}>
            • 앱을 완전히 종료하면 일부 알림을 받지 못할 수 있습니다
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