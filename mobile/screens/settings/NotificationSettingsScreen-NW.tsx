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
  const { colors, isDark } = useTheme();
  const { t } = useAndroidSafeTranslation('settings');

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
              false: isDark ? '#374151' : '#E5E7EB',
              true: '#FF6B6B',
            }}
            thumbColor={value ? '#FFFFFF' : isDark ? '#9CA3AF' : '#FFFFFF'}
            ios_backgroundColor={isDark ? '#374151' : '#E5E7EB'}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function NotificationSettingsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { currentMode } = useAuthStore();
  const { colors, isDark } = useTheme();
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
          <Icon name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
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
                    false: isDark ? '#374151' : '#E5E7EB',
                    true: '#FF6B6B',
                  }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor={isDark ? '#374151' : '#E5E7EB'}
                />
              </View>
            </View>
          </View>

          {/* 매칭 알림 섹션 */}
          <View className="mt-6 px-5">
            <View className="flex-row items-center mb-3">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                {modeTexts.notificationTypes.match}
              </Text>
              <Text className="ml-2 text-2xl">💕</Text>
            </View>

            <SettingItem
              title={t('settings:notificationSettings.types.newMatch')}
              description={t('settings:notificationSettings.descriptions.newMatch')}
              value={settings.newMatch}
              onToggle={() => toggleNotificationType('newMatch')}
              disabled={!settings.pushEnabled}
              icon="heart"
              iconColor="#FF6B6B"
            />

            <SettingItem
              title={t('settings:notificationSettings.types.newLike')}
              description={t('settings:notificationSettings.descriptions.newLike')}
              value={settings.newLike}
              onToggle={() => toggleNotificationType('newLike')}
              disabled={!settings.pushEnabled}
              isPremiumFeature={true}
              icon="heart-outline"
              iconColor="#FF8A8A"
            />

            <SettingItem
              title={t('settings:notificationSettings.types.missedMatch')}
              description={t('settings:notificationSettings.descriptions.missedMatch')}
              value={settings.missedMatch}
              onToggle={() => toggleNotificationType('missedMatch')}
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
              value={settings.newMessage}
              onToggle={() => toggleNotificationType('newMessage')}
              disabled={!settings.pushEnabled}
              icon="chatbubble"
              iconColor="#8B5CF6"
            />

            <SettingItem
              title={t('settings:notificationSettings.types.messagePreview')}
              description={t('settings:notificationSettings.descriptions.messagePreview')}
              value={settings.messagePreview}
              onToggle={() => toggleNotificationType('messagePreview')}
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
              value={settings.promotions}
              onToggle={() => toggleNotificationType('promotions')}
              disabled={!settings.pushEnabled}
              icon="pricetag"
              iconColor="#F59E0B"
            />

            <SettingItem
              title={t('settings:notificationSettings.types.weeklyReport')}
              description={t('settings:notificationSettings.descriptions.weeklyReport')}
              value={settings.weeklyReport}
              onToggle={() => toggleNotificationType('weeklyReport')}
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
                <Icon name="refresh" size={20} color={isDark ? '#FFFFFF' : '#6B7280'} />
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