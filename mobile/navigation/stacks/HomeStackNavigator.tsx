/**
 * 홈 스택 네비게이터
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';
import { HomeStackParamList } from '@/types/navigation';

// Screens
import { HomeScreen } from '@/screens/HomeScreen-NW';
import { CreateContentScreen } from '@/screens/CreateContentScreen-NW';
import { CreateStoryScreen } from '@/screens/CreateStoryScreen-NW';
import { StoryUploadScreen } from '@/screens/StoryUploadScreen-NW';
import { PostDetailScreen } from '@/screens/PostDetailScreen-NW';
import { NearbyUsersScreen } from '@/screens/NearbyUsersScreen-NW';
import { NearbyGroupsScreen } from '@/screens/NearbyGroupsScreen-NW';

const HomeStack = createStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  const { t } = useAndroidSafeTranslation('navigation');
  const { colors } = useTheme();
  
  return (
    <HomeStack.Navigator 
      id={undefined}
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.SURFACE,
        },
        headerTitleStyle: {
          color: colors.TEXT.PRIMARY,
        },
        headerTintColor: colors.TEXT.PRIMARY,
      }}
    >
      <HomeStack.Screen 
        name="HomeScreen" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="CreateContent" 
        component={CreateContentScreen} 
        options={{ 
          title: t('navigation:screens.createContent'),
          headerShown: false,
        }}
      />
      <HomeStack.Screen 
        name="CreateStory" 
        component={CreateStoryScreen} 
        options={{ 
          title: t('navigation:screens.createStory'),
          headerShown: false,
        }}
      />
      <HomeStack.Screen 
        name="StoryUpload" 
        component={StoryUploadScreen} 
        options={{ 
          title: t('navigation:screens.storyUpload'),
          headerShown: false,
        }}
      />
      <HomeStack.Screen 
        name="PostDetail" 
        component={PostDetailScreen} 
        options={{ 
          title: t('navigation:screens.postDetail'),
          headerShown: false,
        }}
      />
      <HomeStack.Screen 
        name="NearbyUsers" 
        component={NearbyUsersScreen} 
        options={{ 
          title: t('navigation:screens.nearbyUsers'),
          headerShown: false,
        }}
      />
      <HomeStack.Screen 
        name="NearbyGroups" 
        component={NearbyGroupsScreen} 
        options={{ 
          title: t('navigation:screens.nearbyGroups'),
          headerShown: false,
        }}
      />
    </HomeStack.Navigator>
  );
}