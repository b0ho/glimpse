/**
 * 홈 화면 리스트 풋터 컴포넌트
 */
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface HomeFooterProps {
  hasMoreData: boolean;
  isLoadingMore: boolean;
  contentsLength: number;
  t: (key: string) => string;
}

export const HomeFooter: React.FC<HomeFooterProps> = ({
  hasMoreData,
  isLoadingMore,
  contentsLength,
  t,
}) => {
  const { colors } = useTheme();

  console.log('[HomeFooter] renderFooter:', { hasMoreData, isLoadingMore, contentsLength });
  
  if (isLoadingMore) {
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.PRIMARY} />
        <Text style={[styles.loadingText, { color: colors.TEXT.PRIMARY }]}>
          {t('home:loading.moreContent')}
        </Text>
      </View>
    );
  }
  
  if (!hasMoreData && contentsLength > 0) {
    return (
      <View style={styles.endReachedFooter}>
        <Text style={[styles.endReachedText, { color: colors.TEXT.SECONDARY }]}>
          {t('home:loading.endReached')}
        </Text>
        <Text style={[styles.endReachedSubtext, { color: colors.TEXT.SECONDARY }]}>
          {t('home:loading.noMoreContent')}
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