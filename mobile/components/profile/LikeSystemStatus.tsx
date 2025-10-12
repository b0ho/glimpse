import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';
import { shadowStyles } from '@/utils/shadowStyles';
import { useLikeStore } from '@/store/slices/likeSlice';
import { SPACING, FONT_SIZES, COLORS } from '@/utils/constants';

interface LikeSystemStatusProps {
  isPremiumUser: boolean;
}

/**
 * 좋아요 시스템 상태 컴포넌트
 * 일일 좋아요, 프리미엄 좋아요 현황을 표시
 */
export const LikeSystemStatus: React.FC<LikeSystemStatusProps> = ({ isPremiumUser }) => {
  const navigation = useNavigation();
  const { t } = useAndroidSafeTranslation('profile');
  const { colors } = useTheme();
  const likeStore = useLikeStore();

  /**
   * 좋아요 되돌리기 핸들러
   */
  const handleRewindLike = async () => {
    const lastLike = likeStore.getLastLike();
    if (!lastLike) {
      Alert.alert(t('common:status.info'), t('profile:likeSystem.noRewinds'));
      return;
    }

    const timeLeft = Math.ceil((lastLike.createdAt.getTime() + 5 * 60 * 1000 - Date.now()) / 1000 / 60);
    
    Alert.alert(
      t('profile:likeSystem.rewindTitle'),
      t('profile:likeSystem.rewindMessage', { 
        type: lastLike.isSuper ? t('profile:likeSystem.superLike') : t('profile:likeSystem.normalLike'),
        timeLeft: Math.max(0, timeLeft)
      }),
      [
        { text: t('common:buttons.cancel'), style: 'cancel' },
        {
          text: t('profile:likeSystem.rewindButton'),
          style: 'destructive',
          onPress: async () => {
            const success = await likeStore.rewindLastLike();
            if (success) {
              Alert.alert(
                t('profile:likeSystem.rewindSuccess'),
                t('profile:likeSystem.rewindSuccessMessage'),
                [{ text: t('common:buttons.confirm') }]
              );
            } else {
              Alert.alert(
                t('common:status.error'),
                likeStore.error || t('profile:likeSystem.rewindError'),
                [{ text: t('common:buttons.confirm') }]
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View className="mb-6 px-4">
      <Text className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
        {t('profile:likeSystem.title')}
      </Text>

      <View className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-4" style={shadowStyles.medium}>
        <View className="flex-row items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800">
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            {t('profile:likeSystem.dailyFreeLikes')}
          </Text>
          <Text className="text-base font-bold text-gray-900 dark:text-white">
            {likeStore.getRemainingFreeLikes()} / 1
          </Text>
        </View>

        <View className="flex-row items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800">
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            {t('profile:likeSystem.premiumLikes')}
          </Text>
          <Text className="text-base font-bold text-gray-900 dark:text-white">
            {t('profile:likeSystem.premiumLikesCount', { count: likeStore.premiumLikesRemaining })}
          </Text>
        </View>

        <View className="flex-row items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800">
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            {t('profile:likeSystem.premiumStatus')}
          </Text>
          <Text className="text-base font-bold text-gray-900 dark:text-white">
            {isPremiumUser ? t('profile:likeSystem.active') : t('profile:likeSystem.inactive')}
          </Text>
        </View>

        {isPremiumUser && (
          <>
            <View className="flex-row items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800">
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                ⭐ {t('profile:likeSystem.superLikes')}
              </Text>
              <Text className="text-base font-bold text-gray-900 dark:text-white">
                {likeStore.getRemainingSuperLikes()} / {likeStore.dailySuperLikesLimit}
              </Text>
            </View>

            <View className="flex-row items-center justify-between py-3">
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                ↩️ {t('profile:likeSystem.rewind')}
              </Text>
              <Text className="text-base font-bold text-gray-900 dark:text-white">
                {likeStore.canRewindLike() ? t('profile:likeSystem.available') : t('profile:likeSystem.unavailable')}
              </Text>
            </View>
          </>
        )}
      </View>

      {!isPremiumUser && (
        <TouchableOpacity
          className="bg-purple-500 py-4 rounded-xl items-center"
          onPress={() => navigation.navigate('Premium' as never)}
          style={shadowStyles.medium}
        >
          <Text className="text-base font-bold text-white">
            {t('profile:premium.upgrade')}
          </Text>
        </TouchableOpacity>
      )}

      {isPremiumUser && likeStore.canRewindLike() && (
        <TouchableOpacity
          className="bg-orange-500 py-4 rounded-xl items-center"
          onPress={handleRewindLike}
          style={shadowStyles.medium}
        >
          <Text className="text-base font-bold text-white">
            {t('profile:likeSystem.rewind')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

