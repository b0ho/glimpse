/**
 * 메인 탭 네비게이터
 */

import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { NAVIGATION_ICONS } from '@/utils/icons';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';
import { MainTabParamList } from '@/types/navigation';

// Stack Navigators
import { HomeStackNavigator } from './stacks/HomeStackNavigator';
import { GroupsStackNavigator } from './stacks/GroupsStackNavigator';
import { InterestStackNavigator } from './stacks/InterestStackNavigator';
import { MatchesStackNavigator } from './stacks/MatchesStackNavigator';
import { ProfileStackNavigator } from './stacks/ProfileStackNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const { t } = useAndroidSafeTranslation('navigation');
  const { colors } = useTheme();
  
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = NAVIGATION_ICONS[route.name] || 'help-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.PRIMARY,
        tabBarInactiveTintColor: colors.TEXT.TERTIARY,
        tabBarStyle: {
          backgroundColor: colors.SURFACE,
          borderTopColor: colors.BORDER,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        headerShown: false,
        lazy: true, // 탭을 처음 방문할 때만 로드
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator} 
        options={{ 
          tabBarLabel: t('navigation:tabs.home'),
          tabBarAccessibilityLabel: t('navigation:tabs.home'),
        }} 
      />
      <Tab.Screen 
        name="Groups" 
        component={GroupsStackNavigator} 
        options={{ 
          tabBarLabel: t('navigation:tabs.groups'),
          tabBarAccessibilityLabel: t('navigation:tabs.groups'),
        }} 
      />
      <Tab.Screen 
        name="Interest" 
        component={InterestStackNavigator} 
        options={{ 
          tabBarLabel: t('navigation:tabs.interest'),
          tabBarAccessibilityLabel: t('navigation:tabs.interest'),
        }} 
      />
      <Tab.Screen 
        name="Matches" 
        component={MatchesStackNavigator} 
        options={{ 
          tabBarLabel: t('navigation:tabs.matches'),
          tabBarAccessibilityLabel: t('navigation:tabs.matches'),
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator} 
        options={{ 
          tabBarLabel: t('navigation:tabs.profile'),
          tabBarAccessibilityLabel: t('navigation:tabs.profile'),
        }} 
      />
    </Tab.Navigator>
  );
}