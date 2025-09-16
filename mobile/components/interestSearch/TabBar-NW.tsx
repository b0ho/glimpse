/**
 * 관심상대/친구 탭 바 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity} from 'react-native';

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
    <View className="tabBar">
      <TouchableOpacity
        style={[
          styles.tabButton,
          selectedTab === 'interest' && [styles.tabButtonActive, { borderBottomColor: colors.PRIMARY }],
        ]}
        onPress={() => onTabChange('interest')}
      >
        <Text
          style={[
            styles.tabButtonText,
            selectedTab === 'interest' 
              ? [styles.tabButtonTextActive, { color: colors.PRIMARY }] 
              : { color: colors.TEXT.SECONDARY },
          ]}
        >
          관심상대 찾기
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.tabButton,
          selectedTab === 'friend' && [styles.tabButtonActive, { borderBottomColor: colors.PRIMARY }],
        ]}
        onPress={() => onTabChange('friend')}
      >
        <Text
          style={[
            styles.tabButtonText,
            selectedTab === 'friend' 
              ? [styles.tabButtonTextActive, { color: colors.PRIMARY }] 
              : { color: colors.TEXT.SECONDARY },
          ]}
        >
          친구 찾기
        </Text>
      </TouchableOpacity>
    </View>
  );
};

