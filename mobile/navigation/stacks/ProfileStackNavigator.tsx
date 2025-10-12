/**
 * 프로필 스택 네비게이터
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';
import { ProfileStackParamList } from '@/types/navigation';

// Screens
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { PremiumScreen } from '@/screens/premium/PremiumScreen';
import { MyGroupsScreen } from '@/screens/groups/MyGroupsScreen';
import { ProfileEditScreen } from '@/screens/profile/ProfileEditScreen';
import { WhoLikesYouScreen } from '@/screens/matches/WhoLikesYouScreen';
import { NotificationSettingsScreen } from '@/screens/settings/NotificationSettingsScreen';
import { LikeHistoryScreen } from '@/screens/matches/LikeHistoryScreen';
import { DeleteAccountScreen } from '@/screens/settings/DeleteAccountScreen';
import { PrivacyPolicyScreen } from '@/screens/settings/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from '@/screens/settings/TermsOfServiceScreen';
import { SupportScreen } from '@/screens/settings/SupportScreen';

const ProfileStack = createStackNavigator<ProfileStackParamList>();

export function ProfileStackNavigator() {
  const { t } = useAndroidSafeTranslation('navigation');
  const { colors } = useTheme();
  
  return (
    <ProfileStack.Navigator 
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
      <ProfileStack.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen 
        name="Premium" 
        component={PremiumScreen} 
        options={{ 
          title: t('navigation:screens.premium'),
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="MyGroups" 
        component={MyGroupsScreen} 
        options={{ 
          title: t('navigation:screens.myGroups'),
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="ProfileEdit" 
        component={ProfileEditScreen} 
        options={{ 
          title: t('navigation:screens.profileEdit'),
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="WhoLikesYou" 
        component={WhoLikesYouScreen} 
        options={{ 
          title: t('navigation:screens.whoLikesYou'),
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="NotificationSettings" 
        component={NotificationSettingsScreen} 
        options={{ 
          title: t('navigation:screens.notificationSettings'),
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="LikeHistory" 
        component={LikeHistoryScreen} 
        options={{ 
          title: t('navigation:screens.likeHistory'),
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="DeleteAccount" 
        component={DeleteAccountScreen} 
        options={{ 
          title: t('navigation:screens.deleteAccount'),
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="PrivacyPolicy" 
        component={PrivacyPolicyScreen} 
        options={{ 
          title: t('navigation:screens.privacyPolicy'),
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="TermsOfService" 
        component={TermsOfServiceScreen} 
        options={{ 
          title: t('navigation:screens.termsOfService'),
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="Support" 
        component={SupportScreen} 
        options={{ 
          title: t('navigation:screens.support'),
          headerShown: false,
        }}
      />
    </ProfileStack.Navigator>
  );
}