/**
 * 그룹 스택 네비게이터
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';
import { GroupsStackParamList } from '@/types/navigation';

// Screens
import { GroupsScreen } from '@/screens/GroupsScreen-NW';
import { CreateGroupScreen } from '@/screens/CreateGroupScreen-NW';
import { LocationGroupScreen } from '@/screens/LocationGroupScreen-NW';
import { NearbyUsersScreen } from '@/screens/NearbyUsersScreen-NW';
import { MapScreen } from '@/screens/MapScreen-NW';
import { GroupInviteScreen } from '@/screens/GroupInviteScreen-NW';
import { JoinGroupScreen } from '@/screens/JoinGroupScreen-NW';
import { GroupManageScreen } from '@/screens/GroupManageScreen-NW';
import { GroupDetailScreen } from '@/screens/GroupDetailScreen-NW';

const GroupsStack = createStackNavigator<GroupsStackParamList>();

export function GroupsStackNavigator() {
  const { t } = useAndroidSafeTranslation('navigation');
  const { colors } = useTheme();
  
  return (
    <GroupsStack.Navigator 
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
      <GroupsStack.Screen 
        name="GroupsTab" 
        component={GroupsScreen} 
        options={{ headerShown: false }}
      />
      <GroupsStack.Screen 
        name="CreateGroup" 
        component={CreateGroupScreen} 
        options={{ 
          title: t('navigation:screens.createGroup'),
          headerShown: false,
        }}
      />
      <GroupsStack.Screen 
        name="LocationGroup" 
        component={LocationGroupScreen} 
        options={{ 
          title: t('navigation:screens.locationGroup'),
          headerShown: false,
        }}
      />
      <GroupsStack.Screen 
        name="NearbyUsers" 
        component={NearbyUsersScreen} 
        options={{ 
          title: t('navigation:screens.nearbyUsers'),
          headerShown: false,
        }}
      />
      <GroupsStack.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ 
          title: t('navigation:screens.map'),
          headerShown: false,
        }}
      />
      <GroupsStack.Screen 
        name="GroupInvite" 
        component={GroupInviteScreen} 
        options={{ 
          title: t('navigation:screens.groupInvite'),
          headerShown: false,
        }}
      />
      <GroupsStack.Screen 
        name="JoinGroup" 
        component={JoinGroupScreen} 
        options={{ 
          title: t('navigation:screens.joinGroup'),
          headerShown: false,
        }}
      />
      <GroupsStack.Screen 
        name="GroupManage" 
        component={GroupManageScreen} 
        options={{ 
          title: t('navigation:screens.groupManage'),
          headerShown: false,
        }}
      />
      <GroupsStack.Screen 
        name="GroupDetail" 
        component={GroupDetailScreen} 
        options={{ 
          title: t('navigation:screens.groupDetail'),
          headerShown: false,
        }}
      />
    </GroupsStack.Navigator>
  );
}