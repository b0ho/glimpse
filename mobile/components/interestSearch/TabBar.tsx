/**
 * 관심상대/친구 탭 바 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

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
    <View style={[styles.tabBar, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
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

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabButtonTextActive: {
    fontWeight: '600',
  },
});