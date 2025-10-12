/**
 * 관심상대/친구 탭 바 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { cn } from '@/lib/utils';

interface TabBarProps {
  selectedTab: 'interest' | 'friend';
  onTabChange: (tab: 'interest' | 'friend') => void;
  colors: any;
}

export const TabBar: React.FC<TabBarProps> = ({
  selectedTab,
  onTabChange,
  colors,
}) => {
  return (
    <View className="flex-row border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <TouchableOpacity
        className={cn(
          "flex-1 py-4 items-center border-b-2",
          selectedTab === 'interest'
            ? "border-primary-500"
            : "border-transparent"
        )}
        style={selectedTab === 'interest' ? { borderBottomColor: colors.PRIMARY } : undefined}
        onPress={() => onTabChange('interest')}
      >
        <Text
          className={cn(
            "text-base font-semibold",
            selectedTab === 'interest'
              ? "text-primary-500"
              : "text-gray-600 dark:text-gray-400"
          )}
          style={{ color: selectedTab === 'interest' ? colors.PRIMARY : colors.TEXT.SECONDARY }}
        >
          관심상대 찾기
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={cn(
          "flex-1 py-4 items-center border-b-2",
          selectedTab === 'friend'
            ? "border-primary-500"
            : "border-transparent"
        )}
        style={selectedTab === 'friend' ? { borderBottomColor: colors.PRIMARY } : undefined}
        onPress={() => onTabChange('friend')}
      >
        <Text
          className={cn(
            "text-base font-semibold",
            selectedTab === 'friend'
              ? "text-primary-500"
              : "text-gray-600 dark:text-gray-400"
          )}
          style={{ color: selectedTab === 'friend' ? colors.PRIMARY : colors.TEXT.SECONDARY }}
        >
          친구 찾기
        </Text>
      </TouchableOpacity>
    </View>
  );
};
