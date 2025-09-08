import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
        {t('profile:likeSystem.title')}
      </Text>
      
      <View style={[styles.likeSystemCard, { backgroundColor: colors.SURFACE, shadowColor: colors.SHADOW }]}>
        <View style={[styles.likeSystemItem, { borderBottomColor: colors.BORDER }]}>
          <Text style={[styles.likeSystemLabel, { color: colors.TEXT.PRIMARY }]}>
            {t('profile:likeSystem.dailyFreeLikes')}
          </Text>
          <Text style={[styles.likeSystemValue, { color: colors.TEXT.PRIMARY }]}>
            {likeStore.getRemainingFreeLikes()} / 1
          </Text>
        </View>
        
        <View style={[styles.likeSystemItem, { borderBottomColor: colors.BORDER }]}>
          <Text style={[styles.likeSystemLabel, { color: colors.TEXT.PRIMARY }]}>
            {t('profile:likeSystem.premiumLikes')}
          </Text>
          <Text style={[styles.likeSystemValue, { color: colors.TEXT.PRIMARY }]}>
            {t('profile:likeSystem.premiumLikesCount', { count: likeStore.premiumLikesRemaining })}
          </Text>
        </View>
        
        <View style={[styles.likeSystemItem, { borderBottomColor: colors.BORDER }]}>
          <Text style={[styles.likeSystemLabel, { color: colors.TEXT.PRIMARY }]}>
            {t('profile:likeSystem.premiumStatus')}
          </Text>
          <Text style={[
            styles.likeSystemValue,
            { color: colors.TEXT.PRIMARY },
            isPremiumUser ? { color: colors.SUCCESS } : { color: colors.TEXT.SECONDARY }
          ]}>
            {isPremiumUser ? t('profile:likeSystem.active') : t('profile:likeSystem.inactive')}
          </Text>
        </View>
        
        {isPremiumUser && (
          <>
            <View style={[styles.likeSystemItem, { borderBottomColor: colors.BORDER }]}>
              <Text style={[styles.likeSystemLabel, { color: colors.TEXT.PRIMARY }]}>
                ⭐ {t('profile:likeSystem.superLikes')}
              </Text>
              <Text style={[styles.likeSystemValue, { color: colors.WARNING, fontWeight: '600' }]}>
                {likeStore.getRemainingSuperLikes()} / {likeStore.dailySuperLikesLimit}
              </Text>
            </View>
            
            <View style={[styles.likeSystemItem, { borderBottomColor: colors.BORDER }]}>
              <Text style={[styles.likeSystemLabel, { color: colors.TEXT.PRIMARY }]}>
                ↩️ {t('profile:likeSystem.rewind')}
              </Text>
              <Text style={[
                styles.likeSystemValue,
                likeStore.canRewindLike() 
                  ? { color: colors.SUCCESS, fontWeight: '600' }
                  : { color: colors.TEXT.LIGHT, fontWeight: '500' }
              ]}>
                {likeStore.canRewindLike() ? t('profile:likeSystem.available') : t('profile:likeSystem.unavailable')}
              </Text>
            </View>
          </>
        )}
      </View>
      
      {!isPremiumUser && (
        <TouchableOpacity 
          style={[styles.upgradeButton, { backgroundColor: colors.PRIMARY }]}
          onPress={() => navigation.navigate('Premium' as never)}
        >
          <Text style={[styles.upgradeButtonText, { color: colors.TEXT.WHITE }]}>
            {t('profile:premium.upgrade')}
          </Text>
        </TouchableOpacity>
      )}
      
      {isPremiumUser && likeStore.canRewindLike() && (
        <TouchableOpacity 
          style={[styles.rewindButton, { backgroundColor: colors.WARNING }]}
          onPress={handleRewindLike}
        >
          <Text style={[styles.rewindButtonText, { color: colors.TEXT.WHITE }]}>
            {t('profile:likeSystem.rewind')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: SPACING.MD,
    marginTop: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    marginBottom: SPACING.MD,
  },
  likeSystemCard: {
    borderRadius: 12,
    ...shadowStyles.card,
  },
  likeSystemItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.MD,
    borderBottomWidth: 1,
  },
  likeSystemLabel: {
    fontSize: FONT_SIZES.MD,
  },
  likeSystemValue: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '500',
  },
  upgradeButton: {
    marginTop: SPACING.MD,
    padding: SPACING.MD,
    borderRadius: 20,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  rewindButton: {
    marginTop: SPACING.MD,
    padding: SPACING.MD,
    borderRadius: 20,
    alignItems: 'center',
  },
  rewindButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
});