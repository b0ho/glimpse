/**
 * 홈 화면 헤더 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/hooks/useTheme';

interface HomeHeaderProps {
  t: (key: string, options?: any) => string;
  remainingLikes: number;
  receivedLikesCount: number;
  userName?: string;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ t, remainingLikes, receivedLikesCount, userName }) => {
  const { colors } = useTheme();
  const navigation = useNavigation() as any;

  return (
    <View className="px-4 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <Text className="text-4xl font-bold text-primary mb-2">Glimpse</Text>
      <Text className="text-lg text-gray-800 dark:text-gray-200 mb-4 font-medium">
        {t('home:header.greeting', { name: userName || t('common:user.defaultName') || '사용자' })}
      </Text>
      
      {/* 위치 기반 기능 버튼들 */}
      <View className="flex-row gap-2">
        <TouchableOpacity
          className="flex-1 flex-row items-center p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
          onPress={() => navigation.navigate('NearbyGroups' as never)}
        >
          <Icon name="location-outline" size={20} color="#FF6B6B" />
          <Text className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-200 ml-2">
            {t('navigation:screens.nearbyGroups')}
          </Text>
          <Icon name="chevron-forward" size={16} color="#FF6B6B" />
        </TouchableOpacity>
        
        <TouchableOpacity
          className="flex-1 flex-row items-center p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
          onPress={() => navigation.navigate('NearbyUsers' as never)}
        >
          <Icon name="people-outline" size={20} color="#4ECDC4" />
          <Text className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-200 ml-2">
            {t('navigation:screens.nearbyUsers')}
          </Text>
          <Icon name="chevron-forward" size={16} color="#4ECDC4" />
        </TouchableOpacity>
      </View>
    </View>
  );
};