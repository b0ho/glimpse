/**
 * 홈 화면 빈 상태 컴포넌트
 */
import React from 'react';
import { View, Text } from 'react-native';

interface HomeEmptyStateProps {
  t: (key: string) => string;
}

export const HomeEmptyState: React.FC<HomeEmptyStateProps> = ({ t }) => {
  return (
    <View className="flex-1 justify-center items-center py-20 px-8">
      <Text className="text-6xl mb-4">📱</Text>
      <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">
        {t('home:empty.title')}
      </Text>
      <Text className="text-sm text-gray-600 dark:text-gray-400 text-center leading-5">
        {t('home:empty.subtitle')}
      </Text>
    </View>
  );
};