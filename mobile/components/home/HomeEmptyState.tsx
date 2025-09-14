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
      <View className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-gray-800 dark:to-gray-700 items-center justify-center mb-6 border-2 border-pink-200 dark:border-gray-600">
        <Icon name="heart" size={60} color="#EC4899" />
      </View>
      <Text className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3 text-center">
        {t('home:empty.title')}
      </Text>
      <Text className="text-base text-gray-600 dark:text-gray-300 text-center leading-6 px-4">
        {t('home:empty.subtitle')}
      </Text>
      <View className="mt-6 px-12 py-3 bg-gradient-to-r from-pink-500 to-purple-500 dark:from-pink-600 dark:to-purple-600 rounded-full">
        <Text className="text-white font-semibold">시작하기</Text>
      </View>
    </View>
  );
};