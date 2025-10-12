/**
 * 홈 스택 네비게이터
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';
import { HomeStackParamList } from '@/types/navigation';

// Screens
import { HomeScreen } from '@/screens/home/HomeScreen';
import { CreateContentScreen } from '@/screens/home/CreateContentScreen';
import { CreateStoryScreen } from '@/screens/premium/CreateStoryScreen';
import { StoryUploadScreen } from '@/screens/home/StoryUploadScreen';
import { PostDetailScreen } from '@/screens/home/PostDetailScreen';
import { NearbyUsersScreen } from '@/screens/nearby/NearbyUsersScreen';
import { NearbyGroupsScreen } from '@/screens/nearby/NearbyGroupsScreen';

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