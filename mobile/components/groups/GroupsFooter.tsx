/**
 * 그룹 리스트 풋터 컴포넌트 (무한 스크롤)
 */
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
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
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.PRIMARY} />
        <Text style={[styles.loadingText, { color: colors.TEXT.PRIMARY }]}>
          {t('group:loading.moreGroups')}
        </Text>
      </View>
    );
  }
  
  if (!hasMoreData && groupsLength > 0) {
    return (
      <View style={styles.endReachedFooter}>
        <Text style={[styles.endReachedText, { color: colors.TEXT.SECONDARY }]}>
          {t('group:loading.endReached')}
        </Text>
        <Text style={[styles.endReachedSubtext, { color: colors.TEXT.SECONDARY }]}>
          {t('group:loading.noMoreGroups')}
        </Text>
      </View>
    );
  }
  
  return null;
};

const styles = StyleSheet.create({
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  endReachedFooter: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  endReachedText: {
    fontSize: 14,
    marginBottom: 4,
  },
  endReachedSubtext: {
    fontSize: 12,
  },
});