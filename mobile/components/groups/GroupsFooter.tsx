/**
 * 그룹 리스트 풋터 컴포넌트 (무한 스크롤)
 */
import React from 'react';
import { View, Text, ActivityIndicator} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface GroupsFooterProps {
  hasMoreData: boolean;
  isLoadingMore: boolean;
  groupsLength: number;
  t: (key: string) => string;
}

export const GroupsFooter: React.FC<GroupsFooterProps> = ({
  hasMoreData,
  isLoadingMore,
  groupsLength,
  t,
}) => {
  const { colors } = useTheme();

  if (isLoadingMore) {
    return (
      <View className="loadingFooter">
        <ActivityIndicator size="small" color={colors.PRIMARY} />
        <Text className="loadingText">
          {t('group:loading.moreGroups')}
        </Text>
      </View>
    );
  }
  
  if (!hasMoreData && groupsLength > 0) {
    return (
      <View className="endReachedFooter">
        <Text className="endReachedText">
          {t('group:loading.endReached')}
        </Text>
        <Text className="endReachedSubtext">
          {t('group:loading.noMoreGroups')}
        </Text>
      </View>
    );
  }
  
  return null;
};

