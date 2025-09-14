/**
 * 홈 화면 헤더 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/hooks/useTheme';

interface HomeHeaderProps {
  t: (key: string) => string;
  remainingLikes: number;
  receivedLikesCount: number;
  userName?: string;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ t, remainingLikes, receivedLikesCount, userName }) => {
  const { colors } = useTheme();
  const navigation = useNavigation() as any;

  return (
    <View className="px-4 py-4 bg-white dark:bg-gray-900 border-b border-pink-100 dark:border-gray-800">
      <Text className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">Glimpse</Text>
      <Text className="text-lg text-gray-800 dark:text-gray-200 mb-3 font-medium">
        {t('home:header.greeting', { name: userName || t('common:user.defaultName') || '사용자' })}
      </Text>
      <View className="flex-row gap-4 mb-3">
        <View className="flex-row items-center bg-pink-50 dark:bg-pink-950 px-3 py-1.5 rounded-full">
          <Icon name="heart" size={14} color="#EC4899" style={{ marginRight: 4 }} />
          <Text className="text-sm font-medium text-pink-600 dark:text-pink-300">
            {t('home:header.receivedLikes', { count: receivedLikesCount })}
          </Text>
        </View>
        <View className="flex-row items-center bg-purple-50 dark:bg-purple-950 px-3 py-1.5 rounded-full">
          <Icon name="heart-outline" size={14} color="#A855F7" style={{ marginRight: 4 }} />
          <Text className="text-sm font-medium text-purple-600 dark:text-purple-300">
            {t('home:header.remainingLikes', { count: remainingLikes })}
          </Text>
        </View>
      </View>
      
      {/* 위치 기반 기능 버튼들 */}
      <View className="flex-row gap-2">
        <TouchableOpacity
          className="flex-1 flex-row items-center p-3 bg-pink-50 dark:bg-gray-800 border border-pink-200 dark:border-gray-700 rounded-xl"
          onPress={() => navigation.navigate('NearbyGroups' as never)}
        >
          <Icon name="location-outline" size={20} color="#EC4899" />
          <Text className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-200 ml-2">
            {t('navigation:screens.nearbyGroups')}
          </Text>
          <Icon name="chevron-forward" size={16} color="#EC4899" />
        </TouchableOpacity>
        
        <TouchableOpacity
          className="flex-1 flex-row items-center p-3 bg-purple-50 dark:bg-gray-800 border border-purple-200 dark:border-gray-700 rounded-xl"
          onPress={() => navigation.navigate('NearbyUsers' as never)}
        >
          <Icon name="people-outline" size={20} color="#A855F7" />
          <Text className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-200 ml-2">
            {t('navigation:screens.nearbyUsers')}
          </Text>
          <Icon name="chevron-forward" size={16} color="#A855F7" />
        </TouchableOpacity>
      </View>
    </View>
  );
};