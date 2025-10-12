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
    <View className="section">
      <Text className="sectionTitle">
        {t('profile:likeSystem.title')}
      </Text>
      
      <View className="likeSystemCard">
        <View className="likeSystemItem">
          <Text className="likeSystemLabel">
            {t('profile:likeSystem.dailyFreeLikes')}
          </Text>
          <Text className="likeSystemValue">
            {likeStore.getRemainingFreeLikes()} / 1
          </Text>
        </View>
        
        <View className="likeSystemItem">
          <Text className="likeSystemLabel">
            {t('profile:likeSystem.premiumLikes')}
          </Text>
          <Text className="likeSystemValue">
            {t('profile:likeSystem.premiumLikesCount', { count: likeStore.premiumLikesRemaining })}
          </Text>
        </View>
        
        <View className="likeSystemItem">
          <Text className="likeSystemLabel">
            {t('profile:likeSystem.premiumStatus')}
          </Text>
          <Text className="likeSystemValue">
            {isPremiumUser ? t('profile:likeSystem.active') : t('profile:likeSystem.inactive')}
          </Text>
        </View>
        
        {isPremiumUser && (
          <>
            <View className="likeSystemItem">
              <Text className="likeSystemLabel">
                ⭐ {t('profile:likeSystem.superLikes')}
              </Text>
              <Text className="likeSystemValue">
                {likeStore.getRemainingSuperLikes()} / {likeStore.dailySuperLikesLimit}
              </Text>
            </View>
            
            <View className="likeSystemItem">
              <Text className="likeSystemLabel">
                ↩️ {t('profile:likeSystem.rewind')}
              </Text>
              <Text className="likeSystemValue">
                {likeStore.canRewindLike() ? t('profile:likeSystem.available') : t('profile:likeSystem.unavailable')}
              </Text>
            </View>
          </>
        )}
      </View>
      
      {!isPremiumUser && (
        <TouchableOpacity 
          className="upgradeButton"
          onPress={() => navigation.navigate('Premium' as never)}
        >
          <Text className="upgradeButtonText">
            {t('profile:premium.upgrade')}
          </Text>
        </TouchableOpacity>
      )}
      
      {isPremiumUser && likeStore.canRewindLike() && (
        <TouchableOpacity 
          className="rewindButton"
          onPress={handleRewindLike}
        >
          <Text className="rewindButtonText">
            {t('profile:likeSystem.rewind')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

