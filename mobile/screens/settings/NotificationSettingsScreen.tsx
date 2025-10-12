/**
 * 알림 설정 화면
 *
 * @screen
 * @description 푸시 알림, 매칭 알림, 메시지 알림, 마케팅 알림 등 모든 알림 설정을 관리하는 화면
 */

import React from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useNotificationStore } from '@/store/slices/notificationSlice';
import { usePremiumStore, premiumSelectors } from '@/store/slices/premiumSlice';
import { useAuthStore } from '@/store/slices/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { fcmService } from '@/services/notifications/fcmService';
import { AppMode, MODE_TEXTS } from '@/shared/types';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '@/lib/utils';

/**
 * 알림 설정 항목 Props 인터페이스
 *
 * @interface SettingItemProps
 * @property {string} title - 설정 항목 제목
 * @property {string} [description] - 설정 항목 설명
 * @property {boolean} value - 현재 활성화 상태
 * @property {() => void} onToggle - 토글 핸들러
 * @property {boolean} [disabled] - 비활성화 상태
 * @property {boolean} [isPremiumFeature] - 프리미엄 기능 여부
 * @property {string} [icon] - 아이콘 이름
 * @property {string} [iconColor] - 아이콘 색상
 */
interface SettingItemProps {
  title: string;
  description?: string;
  value: boolean;
  onToggle: () => void;
  disabled?: boolean;
  isPremiumFeature?: boolean;
  icon?: string;
  iconColor?: string;
}

/**
 * 알림 설정 개별 항목 컴포넌트
 *
 * @component
 * @param {SettingItemProps} props
 * @returns {JSX.Element}
 *
 * @description
 * 알림 설정 화면의 개별 항목을 렌더링합니다.
 * - 토글 스위치
 * - 프리미엄 기능 배지
 * - 애니메이션 효과
 * - 프리미엄 업그레이드 유도
 */
function SettingItem({
  title,
  description,
  value,
  onToggle,
  disabled = false,
  isPremiumFeature = false,
  icon,
  iconColor = '#FF6B6B',
}: SettingItemProps) {
  const isPremium = usePremiumStore(premiumSelectors.isPremiumUser());
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation(['settings', 'common']);

  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    if (isPremiumFeature && !isPremium) {
      // 애니메이션 효과
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

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
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        className={cn(
          "bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3",
          disabled && "opacity-50"
        )}
        onPress={handleToggle}
        disabled={disabled}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            {icon && (
              <View className="bg-pink-100 dark:bg-pink-900/30 rounded-full p-2 mr-3">
                <Icon name={icon} size={20} color={iconColor} />
              </View>
            )}
            <View className="flex-1 mr-3">
              <View className="flex-row items-center">
                <Text className="text-gray-900 dark:text-white font-semibold text-base">
                  {title}
                </Text>
                {isPremiumFeature && !isPremium && (
                  <View className="ml-2 bg-gradient-to-r from-yellow-400 to-yellow-600 px-2 py-0.5 rounded-full">
                    <Text className="text-xs text-white font-bold">PRO</Text>
                  </View>
                )}
              </View>
              {description && (
                <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {description}
                </Text>
              )}
            </View>
          </View>
          <Switch
            value={value && (!isPremiumFeature || isPremium)}
            onValueChange={handleToggle}
            disabled={disabled || (isPremiumFeature && !isPremium)}
            trackColor={{
              false: '#E5E7EB',
              true: '#FF6B6B',
            }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E5E7EB"
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * 알림 설정 화면 컴포넌트
 *
 * @component
 * @returns {JSX.Element}
 *
 * @description
 * 모든 알림 설정을 세밀하게 관리할 수 있는 화면입니다.
 * - 마스터 스위치 (전체 알림 ON/OFF)
 * - 매칭 알림: 새 매칭, 새 좋아요, 슈퍼 좋아요
 * - 메시지 알림: 새 메시지, 그룹 초대
 * - 마케팅 알림: 프로모션, 주간 리포트
 *
 * @features
 * - 카테고리별 알림 설정 (매칭/메시지/마케팅)
 * - 프리미엄 전용 알림 기능 표시
 * - 테스트 알림 발송 기능
 * - 설정 초기화 기능
 * - FCM 푸시 알림 연동
 * - 부드러운 진입 애니메이션
 *
 * @premium
 * - 좋아요 받은 사람 알림
 * - 주간 활동 리포트
 * - PRO 배지 표시
 *
 * @navigation
 * - From: SettingsScreen (설정 화면)
 * - To: Premium (프리미엄 업그레이드)
 *
 * @example
 * ```tsx
 * // 설정 화면에서 이동
 * navigation.navigate('NotificationSettings');
 * ```
 */
export function NotificationSettingsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { currentMode } = useAuthStore();
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation(['settings', 'common']);
  const {
    settings,
    isInitialized,
    toggleNotificationType,
    resetSettings,
    sendTestNotification,
    initializeNotifications,
  } = useNotificationStore();

  const isPremium = usePremiumStore(premiumSelectors.isPremiumUser());
  const modeTexts = React.useMemo(() => {
    const mode = currentMode || AppMode.DATING;
    return MODE_TEXTS[mode] || MODE_TEXTS[AppMode.DATING];
  }, [currentMode]);

  // 애니메이션 값들
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    if (!isInitialized) {
      initializeNotifications();
    }

    // 진입 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isInitialized, initializeNotifications]);

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
              Alert.alert(t('common:success'), t('settings:notificationSettings.alerts.resetSuccess'));
            } catch {
              Alert.alert(t('common:error'), t('settings:notificationSettings.alerts.resetFailed'));
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">
          {t('settings:notificationSettings.title')}
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* 마스터 스위치 */}
          <View className="bg-gradient-to-r from-pink-500 to-purple-500 mx-5 mt-5 rounded-2xl p-1">
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="bg-pink-100 dark:bg-pink-900/30 rounded-full p-3 mr-3">
                    <Icon name="notifications" size={24} color="#FF6B6B" />
                  </View>
                  <View>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg">
                      {t('settings:notificationSettings.masterSwitch')}
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">
                      {settings.pushEnabled ? t('common:enabled') : t('common:disabled')}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.pushEnabled}
                  onValueChange={() => toggleNotificationType('pushEnabled')}
                  trackColor={{
                    false: '#E5E7EB',
                    true: '#FF6B6B',
                  }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>
            </View>
          </View>

          {/* 매칭 알림 섹션 */}
          <View className="mt-6 px-5">
            <View className="flex-row items-center mb-3">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                {modeTexts.notificationTypes?.match || '매칭 알림'}
              </Text>
              <Text className="ml-2 text-2xl">💕</Text>
            </View>

            <SettingItem
              title={t('settings:notificationSettings.types.newMatch')}
              description={t('settings:notificationSettings.descriptions.newMatch')}
              value={settings.newMatches}
              onToggle={() => toggleNotificationType('newMatches')}
              disabled={!settings.pushEnabled}
              icon="heart"
              iconColor="#FF6B6B"
            />

            <SettingItem
              title={t('settings:notificationSettings.types.newLike')}
              description={t('settings:notificationSettings.descriptions.newLike')}
              value={settings.likesReceived}
              onToggle={() => toggleNotificationType('likesReceived')}
              disabled={!settings.pushEnabled}
              isPremiumFeature={true}
              icon="heart-outline"
              iconColor="#FF8A8A"
            />

            <SettingItem
              title={t('settings:notificationSettings.types.superLike')}
              description={t('settings:notificationSettings.descriptions.superLike')}
              value={settings.superLikes}
              onToggle={() => toggleNotificationType('superLikes')}
              disabled={!settings.pushEnabled}
              icon="heart-dislike"
              iconColor="#6B7280"
            />
          </View>

          {/* 메시지 알림 섹션 */}
          <View className="mt-6 px-5">
            <View className="flex-row items-center mb-3">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                {t('settings:notificationSettings.sections.messages')}
              </Text>
              <Text className="ml-2 text-2xl">💬</Text>
            </View>

            <SettingItem
              title={t('settings:notificationSettings.types.newMessage')}
              description={t('settings:notificationSettings.descriptions.newMessage')}
              value={settings.newMessages}
              onToggle={() => toggleNotificationType('newMessages')}
              disabled={!settings.pushEnabled}
              icon="chatbubble"
              iconColor="#8B5CF6"
            />

            <SettingItem
              title={t('settings:notificationSettings.types.groupInvite')}
              description={t('settings:notificationSettings.descriptions.groupInvite')}
              value={settings.groupInvites}
              onToggle={() => toggleNotificationType('groupInvites')}
              disabled={!settings.pushEnabled}
              icon="eye"
              iconColor="#10B981"
            />
          </View>

          {/* 마케팅 알림 섹션 */}
          <View className="mt-6 px-5">
            <View className="flex-row items-center mb-3">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                {t('settings:notificationSettings.sections.marketing')}
              </Text>
              <Text className="ml-2 text-2xl">📢</Text>
            </View>

            <SettingItem
              title={t('settings:notificationSettings.types.promotions')}
              description={t('settings:notificationSettings.descriptions.promotions')}
              value={settings.newMessages}
              onToggle={() => toggleNotificationType('newMessages')}
              disabled={!settings.pushEnabled}
              icon="pricetag"
              iconColor="#F59E0B"
            />

            <SettingItem
              title={t('settings:notificationSettings.types.weeklyReport')}
              description={t('settings:notificationSettings.descriptions.weeklyReport')}
              value={settings.likesReceived}
              onToggle={() => toggleNotificationType('likesReceived')}
              disabled={!settings.pushEnabled}
              isPremiumFeature={true}
              icon="bar-chart"
              iconColor="#3B82F6"
            />
          </View>

          {/* 액션 버튼들 */}
          <View className="mt-8 px-5 mb-10">
            <TouchableOpacity
              onPress={handleSendTestNotification}
              className="bg-blue-500 rounded-2xl py-4 mb-3"
            >
              <View className="flex-row items-center justify-center">
                <Icon name="paper-plane" size={20} color="#FFFFFF" />
                <Text className="ml-2 text-white font-bold text-base">
                  {t('settings:notificationSettings.actions.sendTest')}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleResetNotifications}
              className="bg-gray-200 dark:bg-gray-700 rounded-2xl py-4"
            >
              <View className="flex-row items-center justify-center">
                <Icon name="refresh" size={20} color={colors.TEXT.SECONDARY} />
                <Text className="ml-2 text-gray-600 dark:text-gray-300 font-bold text-base">
                  {t('settings:notificationSettings.actions.reset')}
                </Text>
              </View>
            </TouchableOpacity>

            {/* 프리미엄 프로모션 */}
            {!isPremium && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Premium')}
                className="mt-6"
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="rounded-2xl p-4"
                >
                  <View className="flex-row items-center">
                    <View className="bg-white/30 rounded-full p-2 mr-3">
                      <Icon name="star" size={24} color="#FFFFFF" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-bold text-base">
                        {t('settings:notificationSettings.premium.title')}
                      </Text>
                      <Text className="text-white/90 text-sm mt-1">
                        {t('settings:notificationSettings.premium.description')}
                      </Text>
                    </View>
                    <Icon name="chevron-forward" size={20} color="#FFFFFF" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}