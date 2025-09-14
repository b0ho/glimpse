/**
 * 홈 화면 리스트 풋터 컴포넌트
 */
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
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
      <View className="py-5 items-center">
        <ActivityIndicator size="small" color={colors.PRIMARY} />
        <Text className="mt-2 text-sm text-gray-900 dark:text-gray-100">
          {t('home:loading.moreContent')}
        </Text>
      </View>
    );
  }
  
  if (!hasMoreData && contentsLength > 0) {
    return (
      <View className="py-8 items-center">
        <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          {t('home:loading.endReached')}
        </Text>
        <Text className="text-xs text-gray-600 dark:text-gray-400">
          {t('home:loading.noMoreContent')}
        </Text>
      </View>
    );
  }
  
  return null;
};