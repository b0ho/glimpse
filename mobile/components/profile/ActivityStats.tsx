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
    <View className="mb-6 px-4">
      <Text className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
        {t('profile:stats.title', 'Activity Stats')}
      </Text>

      <View className="flex-row flex-wrap bg-white dark:bg-gray-900 rounded-2xl p-4">
        <View className="w-1/2 items-center py-3 border-r border-b border-gray-200 dark:border-gray-800">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">{joinedGroupsCount}</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('profile:stats.joinedGroups', 'Joined Groups')}
          </Text>
        </View>

        <View className="w-1/2 items-center py-3 border-b border-gray-200 dark:border-gray-800">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">{sentLikesCount}</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('profile:stats.sentLikes', 'Sent Likes')}
          </Text>
        </View>

        <View className="w-1/2 items-center py-3 border-r border-gray-200 dark:border-gray-800">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">{receivedLikesCount}</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('profile:stats.receivedLikes', 'Received Likes')}
          </Text>
        </View>

        <View className="w-1/2 items-center py-3">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">{matchesCount}</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('profile:stats.totalMatches', 'Total Matches')}
          </Text>
        </View>
      </View>
    </View>
  );
};

