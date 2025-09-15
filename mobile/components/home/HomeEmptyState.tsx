/**
 * 홈 화면 빈 상태 컴포넌트
 */
import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface HomeEmptyStateProps {
  t: (key: string) => string;
}

export const HomeEmptyState: React.FC<HomeEmptyStateProps> = ({ t }) => {
  return (
    <View className="flex-1 justify-center items-center py-20 px-8">
      <View className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center mb-6 border-2 border-gray-200 dark:border-gray-600">
        <Icon name="heart" size={60} color="#FF6B6B" />
      </View>
      <Text className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3 text-center">
        {t('home:empty.title')}
      </Text>
      <Text className="text-base text-gray-600 dark:text-gray-300 text-center leading-6 px-4">
        {t('home:empty.subtitle')}
      </Text>
      <View className="mt-6 px-12 py-3 bg-primary rounded-full">
        <Text className="text-white font-semibold">시작하기</Text>
      </View>
    </View>
  );
};