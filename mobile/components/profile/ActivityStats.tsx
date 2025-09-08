import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';
import { SPACING, FONT_SIZES } from '@/utils/constants';

interface ActivityStatsProps {
  joinedGroupsCount: number;
  sentLikesCount: number;
  receivedLikesCount: number;
  matchesCount: number;
}

/**
 * 활동 통계 컴포넌트
 * 참여 그룹, 좋아요, 매칭 통계를 표시
 */
export const ActivityStats: React.FC<ActivityStatsProps> = ({
  joinedGroupsCount,
  sentLikesCount,
  receivedLikesCount,
  matchesCount,
}) => {
  const { t } = useAndroidSafeTranslation('profile');
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
        {t('profile:stats.title', '활동 통계')}
      </Text>
      
      <View style={styles.statsGrid}>
        <View style={[styles.statItem, { backgroundColor: colors.SURFACE, shadowColor: colors.SHADOW }]}>
          <Text style={[styles.statNumber, { color: colors.PRIMARY }]}>{joinedGroupsCount}</Text>
          <Text style={[styles.statLabel, { color: colors.TEXT.SECONDARY }]}>
            {t('profile:stats.joinedGroups', '참여 그룹')}
          </Text>
        </View>
        
        <View style={[styles.statItem, { backgroundColor: colors.SURFACE, shadowColor: colors.SHADOW }]}>
          <Text style={[styles.statNumber, { color: colors.PRIMARY }]}>{sentLikesCount}</Text>
          <Text style={[styles.statLabel, { color: colors.TEXT.SECONDARY }]}>
            {t('profile:stats.sentLikes', '보낸 좋아요')}
          </Text>
        </View>
        
        <View style={[styles.statItem, { backgroundColor: colors.SURFACE, shadowColor: colors.SHADOW }]}>
          <Text style={[styles.statNumber, { color: colors.PRIMARY }]}>{receivedLikesCount}</Text>
          <Text style={[styles.statLabel, { color: colors.TEXT.SECONDARY }]}>
            {t('profile:stats.receivedLikes', '받은 좋아요')}
          </Text>
        </View>
        
        <View style={[styles.statItem, { backgroundColor: colors.SURFACE, shadowColor: colors.SHADOW }]}>
          <Text style={[styles.statNumber, { color: colors.PRIMARY }]}>{matchesCount}</Text>
          <Text style={[styles.statLabel, { color: colors.TEXT.SECONDARY }]}>
            {t('profile:stats.totalMatches', '총 매칭')}
          </Text>
        </View>
      </View>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.SM,
  },
  statItem: {
    width: '48%',
    padding: SPACING.MD,
    borderRadius: 12,
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  statNumber: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    marginBottom: SPACING.XS,
  },
  statLabel: {
    fontSize: FONT_SIZES.SM,
    textAlign: 'center',
  },
});