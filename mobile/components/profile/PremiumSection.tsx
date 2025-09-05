import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';
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
    <View style={styles.section}>
      <TouchableOpacity
        style={[
          styles.premiumCard,
          { backgroundColor: colors.SURFACE, borderColor: colors.BORDER },
          isPremiumUser 
            ? { borderColor: colors.SUCCESS, backgroundColor: colors.SUCCESS + '10' } 
            : { borderColor: colors.PRIMARY + '40', backgroundColor: colors.PRIMARY + '10' },
        ]}
        onPress={() => navigation.navigate('Premium' as never)}
      >
        <View style={styles.premiumHeader}>
          <Text style={[
            styles.premiumTitle,
            { color: isPremiumUser ? colors.SUCCESS : colors.PRIMARY },
          ]}>
            {isPremiumUser ? t('profile:premium.active') : t('profile:premium.upgrade')}
          </Text>
          {isPremiumUser && (
            <View style={[styles.premiumBadge, { backgroundColor: colors.SUCCESS }]}>
              <Text style={[styles.premiumBadgeText, { color: colors.TEXT.WHITE }]}>
                {currentPlan.includes('yearly') ? t('profile:premium.yearly') : t('profile:premium.monthly')}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={[styles.premiumDescription, { color: colors.TEXT.SECONDARY }]}>
          {isPremiumUser 
            ? t('profile:premium.activeDescription')
            : t('profile:premium.inactiveDescription')
          }
        </Text>
        
        <View style={styles.premiumFeatures}>
          <Text style={[styles.premiumFeature, { color: colors.TEXT.PRIMARY }]}>
            💕 {isPremiumUser ? t('profile:premium.features.unlimitedLikes') : t('profile:premium.features.dailyToUnlimited')}
          </Text>
          <Text style={[styles.premiumFeature, { color: colors.TEXT.PRIMARY }]}>
            👀 {isPremiumUser ? t('profile:premium.features.seeWhoLikedYou') : t('profile:premium.features.seeWhoLikedYouInfo')}
          </Text>
          <Text style={[styles.premiumFeature, { color: colors.TEXT.PRIMARY }]}>
            ⚡ {isPremiumUser ? t('profile:premium.features.priorityMatching') : t('profile:premium.features.priorityMatchingInfo')}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: SPACING.MD,
    marginTop: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  premiumCard: {
    padding: SPACING.LG,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 3,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.SM,
  },
  premiumTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
  },
  premiumBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumBadgeText: {
    fontSize: FONT_SIZES.XS,
    fontWeight: '600',
  },
  premiumDescription: {
    fontSize: FONT_SIZES.SM,
    marginBottom: SPACING.MD,
  },
  premiumFeatures: {
    gap: SPACING.SM,
  },
  premiumFeature: {
    fontSize: FONT_SIZES.SM,
    lineHeight: 20,
  },
});