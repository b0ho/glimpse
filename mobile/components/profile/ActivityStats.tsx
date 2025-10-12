import React from 'react';
import {
  View,
  Text
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
    <View className="section">
      <Text className="sectionTitle">
        {t('profile:stats.title', '활동 통계')}
      </Text>
      
      <View className="statsGrid">
        <View className="statItem">
          <Text className="statNumber">{joinedGroupsCount}</Text>
          <Text className="statLabel">
            {t('profile:stats.joinedGroups', '참여 그룹')}
          </Text>
        </View>
        
        <View className="statItem">
          <Text className="statNumber">{sentLikesCount}</Text>
          <Text className="statLabel">
            {t('profile:stats.sentLikes', '보낸 좋아요')}
          </Text>
        </View>
        
        <View className="statItem">
          <Text className="statNumber">{receivedLikesCount}</Text>
          <Text className="statLabel">
            {t('profile:stats.receivedLikes', '받은 좋아요')}
          </Text>
        </View>
        
        <View className="statItem">
          <Text className="statNumber">{matchesCount}</Text>
          <Text className="statLabel">
            {t('profile:stats.totalMatches', '총 매칭')}
          </Text>
        </View>
      </View>
    </View>
  );
};

