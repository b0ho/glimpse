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
    <View className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <Text className="text-3xl font-bold text-primary mb-1">Glimpse</Text>
      <Text className="text-base text-gray-900 dark:text-gray-100 mb-2">
        {t('home:header.greeting', { name: userName || t('common:user.defaultName') || '사용자' })}
      </Text>
      <View className="flex-row gap-4 mb-3">
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          {t('home:header.receivedLikes', { count: receivedLikesCount })}
        </Text>
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          {t('home:header.remainingLikes', { count: remainingLikes })}
        </Text>
      </View>
      
      {/* 위치 기반 기능 버튼들 */}
      <View className="flex-row gap-2">
        <TouchableOpacity
          className="flex-1 flex-row items-center p-2.5 bg-white dark:bg-gray-800 border border-primary/20 rounded-lg"
          onPress={() => navigation.navigate('NearbyGroups' as never)}
        >
          <Icon name="location-outline" size={20} color={colors.PRIMARY} />
          <Text className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 ml-1.5">
            {t('navigation:screens.nearbyGroups')}
          </Text>
          <Icon name="chevron-forward" size={16} color={colors.TEXT.SECONDARY} />
        </TouchableOpacity>
        
        <TouchableOpacity
          className="flex-1 flex-row items-center p-2.5 bg-white dark:bg-gray-800 border border-primary/20 rounded-lg"
          onPress={() => navigation.navigate('NearbyUsers' as never)}
        >
          <Icon name="people-outline" size={20} color={colors.PRIMARY} />
          <Text className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 ml-1.5">
            {t('navigation:screens.nearbyUsers')}
          </Text>
          <Icon name="chevron-forward" size={16} color={colors.TEXT.SECONDARY} />
        </TouchableOpacity>
      </View>
    </View>
  );
};