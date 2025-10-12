import React from 'react';
import {
  View,
  Text,
  TouchableOpacity
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';
import { shadowStyles } from '@/utils/shadowStyles';
import { SPACING, FONT_SIZES } from '@/utils/constants';

interface PremiumSectionProps {
  isPremiumUser: boolean;
  currentPlan: string;
}

/**
 * 프리미엄 섹션 컴포넌트
 * 프리미엄 구독 상태와 혜택을 표시
 */
export const PremiumSection: React.FC<PremiumSectionProps> = ({ 
  isPremiumUser, 
  currentPlan 
}) => {
  const navigation = useNavigation();
  const { t } = useAndroidSafeTranslation('profile');
  const { colors } = useTheme();

  return (
    <View className="mb-6 px-4">
      <TouchableOpacity
        className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 rounded-2xl"
        onPress={() => navigation.navigate('Premium' as never)}
        style={shadowStyles.large}
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xl font-bold text-white">
            {isPremiumUser ? '✨ ' + t('profile:premium.active') : t('profile:premium.upgrade')}
          </Text>
          {isPremiumUser && (
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-sm font-semibold text-white">
                {currentPlan.includes('yearly') ? t('profile:premium.yearly') : t('profile:premium.monthly')}
              </Text>
            </View>
          )}
        </View>

        <Text className="text-base text-white/90 mb-4">
          {isPremiumUser
            ? t('profile:premium.activeDescription')
            : t('profile:premium.inactiveDescription')
          }
        </Text>

        <View className="space-y-2">
          <Text className="text-sm text-white">
            💕 {isPremiumUser ? t('profile:premium.features.unlimitedLikes') : t('profile:premium.features.dailyToUnlimited')}
          </Text>
          <Text className="text-sm text-white">
            👀 {isPremiumUser ? t('profile:premium.features.seeWhoLikedYou') : t('profile:premium.features.seeWhoLikedYouInfo')}
          </Text>
          <Text className="text-sm text-white">
            ⚡ {isPremiumUser ? t('profile:premium.features.priorityMatching') : t('profile:premium.features.priorityMatchingInfo')}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

