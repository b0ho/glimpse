/**
 * 매치 스택 네비게이터
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '@/hooks/useTheme';
import { MatchesStackParamList } from '@/types/navigation';

// Screens
import { MatchesScreen } from '@/screens/matches/MatchesScreen-NW';
import { ChatScreen } from '@/screens/chat/ChatScreen-NW';

const MatchesStack = createStackNavigator<MatchesStackParamList>();

export function MatchesStackNavigator() {
  const { colors } = useTheme();
  
  return (
    <MatchesStack.Navigator 
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
      <MatchesStack.Screen 
        name="MatchesTab" 
        component={MatchesScreen} 
        options={{ headerShown: false }}
      />
      <MatchesStack.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{ 
          headerShown: true,
        }}
      />
    </MatchesStack.Navigator>
  );
}