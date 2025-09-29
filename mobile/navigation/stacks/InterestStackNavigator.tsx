/**
 * 관심상대 찾기 스택 네비게이터
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';
import { InterestStackParamList } from '@/types/navigation';

// Screens
import { InterestSearchScreen } from '@/screens/matches/InterestSearchScreen-NW';
import { AddInterestScreen } from '@/screens/matches/AddInterestScreen-NW';
import { MyInfoRegisterScreen } from '@/screens/matches/MyInfoRegisterScreen-NW';
import { MyInfoScreen } from '@/screens/profile/MyInfoScreen-NW';
import { ChatScreen } from '@/screens/chat/ChatScreen-NW';

const InterestStack = createStackNavigator<InterestStackParamList>();

export function InterestStackNavigator() {
  const { t } = useAndroidSafeTranslation('navigation');
  const { colors } = useTheme();
  
  return (
    <InterestStack.Navigator 
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
      <InterestStack.Screen 
        name="InterestSearchScreen" 
        component={InterestSearchScreen} 
        options={{ headerShown: false }}
      />
      <InterestStack.Screen 
        name="AddInterest" 
        component={AddInterestScreen} 
        options={{ 
          title: t('navigation:screens.addInterest'),
          headerShown: false,
        }}
      />
      <InterestStack.Screen 
        name="MyInfoRegister" 
        component={MyInfoRegisterScreen} 
        options={{ 
          title: t('navigation:screens.myInfoRegister'),
          headerShown: false,
        }}
      />
      <InterestStack.Screen 
        name="MyInfo" 
        component={MyInfoScreen} 
        options={{ 
          title: t('navigation:screens.myInfo'),
          headerShown: false,
        }}
      />
      <InterestStack.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{ 
          headerShown: true,
        }}
      />
    </InterestStack.Navigator>
  );
}