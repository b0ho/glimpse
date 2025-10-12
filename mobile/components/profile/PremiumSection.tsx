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
    <View className="section">
      <TouchableOpacity
        className="premiumCard"
        onPress={() => navigation.navigate('Premium' as never)}
      >
        <View className="premiumHeader">
          <Text className="premiumTitle">
            {isPremiumUser ? t('profile:premium.active') : t('profile:premium.upgrade')}
          </Text>
          {isPremiumUser && (
            <View className="premiumBadge">
              <Text className="premiumBadgeText">
                {currentPlan.includes('yearly') ? t('profile:premium.yearly') : t('profile:premium.monthly')}
              </Text>
            </View>
          )}
        </View>
        
        <Text className="premiumDescription">
          {isPremiumUser 
            ? t('profile:premium.activeDescription')
            : t('profile:premium.inactiveDescription')
          }
        </Text>
        
        <View className="premiumFeatures">
          <Text className="premiumFeature">
            💕 {isPremiumUser ? t('profile:premium.features.unlimitedLikes') : t('profile:premium.features.dailyToUnlimited')}
          </Text>
          <Text className="premiumFeature">
            👀 {isPremiumUser ? t('profile:premium.features.seeWhoLikedYou') : t('profile:premium.features.seeWhoLikedYouInfo')}
          </Text>
          <Text className="premiumFeature">
            ⚡ {isPremiumUser ? t('profile:premium.features.priorityMatching') : t('profile:premium.features.priorityMatchingInfo')}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

