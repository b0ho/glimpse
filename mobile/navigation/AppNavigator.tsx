/**
 * 앱 네비게이터
 * @module navigation/AppNavigator
 * @description 데이팅/친구 모드 및 모든 화면 네비게이션 관리
 */

import React, { useRef, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, NavigationContainerRef, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '@/hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { NAVIGATION_ICONS } from '@/utils/icons';
// import { CallProvider } from '@/providers/CallProvider';
import { navigationService } from '@/services/navigation/navigationService';
import { initializeFCM, cleanupFCM } from '@/services/notifications/initializeFCM';
import { useAuthStore } from '@/store/slices/authSlice';
import { setAuthToken } from '@/services/api/config';
import { AppMode } from '../shared/types';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';

// Screens
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { AuthScreen } from '@/screens/auth/AuthScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { GroupsScreen } from '@/screens/GroupsScreen';
import { MatchesScreen } from '@/screens/MatchesScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { CreateContentScreen } from '@/screens/CreateContentScreen';
import { CreateStoryScreen } from '@/screens/CreateStoryScreen';
import { CreateGroupScreen } from '@/screens/CreateGroupScreen';
import { MyGroupsScreen } from '@/screens/MyGroupsScreen';
import { ChatScreenSimple as ChatScreen } from '@/screens/ChatScreenSimple';
import { PremiumScreen } from '@/screens/PremiumScreen';
import { LocationGroupScreen } from '@/screens/LocationGroupScreen';
import { NearbyUsersScreen } from '@/screens/NearbyUsersScreen';
import { NearbyGroupsScreen } from '@/screens/NearbyGroupsScreen';
import { MapScreen } from '@/screens/MapScreen';
import { NotificationSettingsScreen } from '@/screens/NotificationSettingsScreen';
import { WhoLikesYouScreen } from '@/screens/WhoLikesYouScreen';
import { StoryUploadScreen } from '@/screens/StoryUploadScreen';
import { GroupInviteScreen } from '@/screens/GroupInviteScreen';
import { JoinGroupScreen } from '@/screens/JoinGroupScreen';
import { GroupManageScreen } from '@/screens/GroupManageScreen';
import { ModeSelectionScreen } from '@/screens/ModeSelectionScreen';
import { LikeHistoryScreen } from '@/screens/LikeHistoryScreen';
import { DeleteAccountScreen } from '@/screens/DeleteAccountScreen';
import { InterestSearchScreen } from '@/screens/InterestSearchScreen';
import { AddInterestScreen } from '@/screens/AddInterestScreen';
import { MyInfoScreen } from '@/screens/MyInfoScreen';
import { GroupDetailScreen } from '@/screens/GroupDetailScreen';
import { PostDetailScreen } from '@/screens/PostDetailScreen';
import { PrivacyPolicyScreen } from '@/screens/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from '@/screens/TermsOfServiceScreen';
import { SupportScreen } from '@/screens/SupportScreen';
import {
  RootStackParamList,
  HomeStackParamList,
  GroupsStackParamList,
  MatchesStackParamList,
  ProfileStackParamList,
  InterestStackParamList,
  MainTabParamList,
  AuthStackParamList
} from '@/types/navigation';

/**
 * 네비게이션 스택 생성
 * @description 각 네비게이션 스택을 타입과 함께 생성
 */

// App-specific stack types
type AppStackParamList = {
  Auth: undefined;
  ModeSelection: undefined;
  Main: undefined;
};


const Stack = createStackNavigator<AppStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const GroupsStack = createStackNavigator<GroupsStackParamList>();
const MatchesStack = createStackNavigator<MatchesStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();
const InterestStack = createStackNavigator<InterestStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// 모든 메인 화면들이 실제 컴포넌트로 구현됨

/**
 * 인증 화면 래퍼
 * @component AuthScreenWrapper
 * @description 인증 완료 처리를 위한 래퍼 컴포넌트
 */
const AuthScreenWrapper = () => {
  const handleAuthCompleted = () => {
    console.log('Authentication completed');
    // 인증 완료 후 자동으로 메인 화면으로 이동 (Clerk가 처리)
  };

  return <AuthScreen onAuthCompleted={handleAuthCompleted} />;
};

/**
 * 인증 네비게이터
 * @function AuthNavigator
 * @returns {JSX.Element} 인증 스택 네비게이터
 * @description 로그인하지 않은 사용자를 위한 인증 화면
 */
function AuthNavigator() {
  const { t } = useAndroidSafeTranslation('navigation');
  
  return (
    <AuthStack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <AuthStack.Screen 
        name="Auth" 
        component={AuthScreenWrapper}
        options={{ title: t('navigation:screens.auth') }}
      />
    </AuthStack.Navigator>
  );
}

/**
 * 홈 스택 네비게이터
 * @function HomeStackNavigator
 * @returns {JSX.Element} 홈 스택 네비게이터
 * @description 메인 피드, 컨텐츠 작성, 스토리 업로드
 */
function HomeStackNavigator() {
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
        name="HomeTab" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="CreateContent" 
        component={CreateContentScreen} 
        options={{ 
          title: t('navigation:screens.createContent'),
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <HomeStack.Screen 
        name="CreateStory" 
        component={CreateStoryScreen} 
        options={{ 
          title: t('navigation:screens.createStory'),
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <HomeStack.Screen 
        name="StoryUpload" 
        component={StoryUploadScreen} 
        options={{ 
          title: t('navigation:screens.storyUpload'),
          headerShown: false,
          presentation: 'modal',
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
      <HomeStack.Screen 
        name="PostDetail" 
        component={PostDetailScreen} 
        options={{ 
          title: t('navigation:screens.postDetail'),
          headerShown: false,
        }}
      />
    </HomeStack.Navigator>
  );
}

/**
 * 그룹 스택 네비게이터
 * @function GroupsStackNavigator
 * @returns {JSX.Element} 그룹 스택 네비게이터
 * @description 그룹 목록, 생성, 위치 기반 그룹, 초대 관리
 */
function GroupsStackNavigator() {
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
          presentation: 'modal',
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
          presentation: 'modal',
        }}
      />
      <GroupsStack.Screen 
        name="JoinGroup" 
        component={JoinGroupScreen} 
        options={{ 
          title: t('navigation:screens.joinGroup'),
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <GroupsStack.Screen 
        name="GroupManage" 
        component={GroupManageScreen} 
        options={{ 
          title: t('navigation:screens.groupManage'),
          headerShown: false,
          presentation: 'modal',
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

/**
 * 매치 스택 네비게이터
 * @function MatchesStackNavigator
 * @returns {JSX.Element} 매치 스택 네비게이터
 * @description 매칭 목록과 채팅 화면
 */
function MatchesStackNavigator() {
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

/**
 * 관심상대 찾기 스택 네비게이터
 * @function InterestStackNavigator
 * @returns {JSX.Element} 관심상대 찾기 스택 네비게이터
 * @description 관심상대 검색과 등록 화면
 */
function InterestStackNavigator() {
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation('navigation');
  
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
          presentation: 'modal',
        }}
      />
      <InterestStack.Screen 
        name="MyInfo" 
        component={MyInfoScreen} 
        options={{ 
          title: t('navigation:screens.myInfo'),
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <InterestStack.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{ 
          headerShown: true,
        }}
      />
      <InterestStack.Screen 
        name="Premium" 
        component={PremiumScreen} 
        options={{ 
          headerShown: false,
        }}
      />
    </InterestStack.Navigator>
  );
}

/**
 * 프로필 스택 네비게이터
 * @function ProfileStackNavigator
 * @returns {JSX.Element} 프로필 스택 네비게이터
 * @description 프로필, 프리미엄, 알림 설정, 계정 관리
 */
function ProfileStackNavigator() {
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation('navigation');
  
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
        name="MyGroups" 
        component={MyGroupsScreen} 
        options={{ 
          title: t('navigation:screens.myGroups'),
          headerShown: true,
        }}
      />
      <ProfileStack.Screen 
        name="Premium" 
        component={PremiumScreen} 
        options={{ 
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="NotificationSettings" 
        component={NotificationSettingsScreen} 
        options={{ 
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="WhoLikesYou" 
        component={WhoLikesYouScreen} 
        options={{ 
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="LikeHistory" 
        component={LikeHistoryScreen} 
        options={{ 
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="DeleteAccount" 
        component={DeleteAccountScreen} 
        options={{ 
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="PrivacyPolicy" 
        component={PrivacyPolicyScreen} 
        options={{ 
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="TermsOfService" 
        component={TermsOfServiceScreen} 
        options={{ 
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="Support" 
        component={SupportScreen} 
        options={{ 
          headerShown: false,
        }}
      />
    </ProfileStack.Navigator>
  );
}

/**
 * 메인 탭 네비게이터 - 단일 통합 네비게이터
 * @function MainTabNavigator
 * @returns {JSX.Element} 통합 탭 네비게이터
 * @description 모든 모드에서 사용하는 단일 탭 네비게이터 (홈, 그룹, 찾기, 채팅, 프로필)
 */
function MainTabNavigator() {
  const { currentMode } = useAuthStore();
  const { t, ready } = useAndroidSafeTranslation('navigation');
  const { colors } = useTheme();
  
  // 모든 플랫폼에서 i18n이 준비되지 않았을 때 fallback 제공
  const getTabTitle = (key: string, fallback: string) => {
    if (!ready) {
      return fallback;
    }
    const translation = t(key);
    // 키가 그대로 반환되면 fallback 사용
    if (typeof translation === 'string' && (translation === key || translation.includes('.'))) {
      return fallback;
    }
    return String(translation);
  };

  // 모드별 탭 색상 설정
  const tabBarActiveTintColor = currentMode === AppMode.DATING 
    ? colors.PRIMARY 
    : (colors.SECONDARY || '#4ECDC4');
  
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.BACKGROUND,
          borderTopWidth: 1,
          borderTopColor: colors.BORDER,
          height: 60,
        },
        tabBarActiveTintColor,
        tabBarInactiveTintColor: colors.TEXT.SECONDARY,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator}
        options={{
          title: getTabTitle('navigation:tabs.home', '홈'),
          tabBarIcon: ({ color, size }) => <Icon name={NAVIGATION_ICONS.HOME} color={color} size={size || 24} />,
          tabBarAccessibilityLabel: String(t('navigation:accessibility.home')),
        }}
      />
      <Tab.Screen 
        name="Groups" 
        component={GroupsStackNavigator}
        options={{
          title: getTabTitle('navigation:tabs.groups', '그룹'),
          tabBarIcon: ({ color, size }) => <Icon name={NAVIGATION_ICONS.GROUPS} color={color} size={size || 24} />,
          tabBarAccessibilityLabel: String(t('navigation:accessibility.groups')),
        }}
      />
      <Tab.Screen 
        name="Interest" 
        component={InterestStackNavigator}
        options={{
          title: getTabTitle('navigation:tabs.interest', '찾기'),
          tabBarIcon: ({ color, size }) => <Icon name="search-outline" color={color} size={size || 24} />,
          tabBarAccessibilityLabel: String(t('navigation:accessibility.interest')),
        }}
      />
      <Tab.Screen 
        name="Matches" 
        component={MatchesStackNavigator}
        options={{
          title: currentMode === AppMode.DATING 
            ? getTabTitle('navigation:tabs.matches', '채팅')
            : getTabTitle('navigation:tabs.friends', '친구목록'),
          tabBarIcon: ({ color, size }) => (
            <Icon 
              name={currentMode === AppMode.DATING ? "chatbubbles-outline" : "people-outline"} 
              color={color} 
              size={size || 24} 
            />
          ),
          tabBarAccessibilityLabel: currentMode === AppMode.DATING 
            ? String(t('navigation:accessibility.matches'))
            : String(t('navigation:accessibility.friends')),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator}
        options={{
          title: getTabTitle('navigation:tabs.profile', '프로필'),
          tabBarIcon: ({ color, size }) => <Icon name={NAVIGATION_ICONS.PROFILE} color={color} size={size || 24} />,
          tabBarAccessibilityLabel: String(t('navigation:accessibility.profile')),
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * 앱 네비게이터
 * @function AppNavigator
 * @returns {JSX.Element} 앱 네비게이터
 * @description 인증 상태와 모드 선택에 따른 화면 라우팅
 */
function AppNavigator() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { currentMode, user } = useAuthStore();
  const { colors } = useTheme();
  const [hasSelectedMode, setHasSelectedMode] = React.useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = React.useState<boolean | null>(null);
  
  // 개발 모드 또는 Vercel 도메인에서는 Zustand 스토어의 user 상태도 확인
  const isVercelDomain = typeof window !== 'undefined' && 
                        window.location?.hostname?.includes('vercel.app');
  const isAuthenticated = (__DEV__ || isVercelDomain) ? (isSignedIn || !!user) : isSignedIn;

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem('@glimpse_onboarding_completed');
        setHasCompletedOnboarding(completed === 'true');
      } catch (error) {
        console.error('[Onboarding] Failed to check status:', error);
        setHasCompletedOnboarding(true); // Default to completed on error
      }
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    // Check if user has selected a mode
    if (isAuthenticated && currentMode) {
      setHasSelectedMode(true);
    } else if (!isAuthenticated) {
      // Reset mode selection when user logs out
      setHasSelectedMode(false);
    }
  }, [isAuthenticated, currentMode]);

  useEffect(() => {
    // Clerk 토큰을 API 클라이언트에 설정
    const setupToken = async () => {
      if (isAuthenticated && getToken) {
        try {
          const token = await getToken();
          if (token) {
            setAuthToken(token);
            console.log('[Auth] Clerk token set for API client');
          }
        } catch (error) {
          console.error('[Auth] Failed to get Clerk token:', error);
        }
      } else {
        setAuthToken(null);
      }
    };
    
    setupToken();
  }, [isAuthenticated, getToken]);

  if (!isLoaded || hasCompletedOnboarding === null) {
    return null; // 로딩 화면은 App.tsx에서 처리
  }

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    setHasCompletedOnboarding(true);
  };

  return (
    <Stack.Navigator 
      id={undefined} 
      screenOptions={{ 
        headerShown: false,
        cardStyle: {
          backgroundColor: colors.BACKGROUND,
        },
      }}
    >
      {isAuthenticated ? (
        // 로그인된 사용자: 바로 메인화면으로 이동 (온보딩 스킵)
        <>
          {!hasSelectedMode ? (
            <Stack.Screen 
              name="ModeSelection" 
              component={ModeSelectionScreen} 
            />
          ) : (
            <Stack.Screen 
              name="Main" 
              component={MainTabNavigator} 
            />
          )}
        </>
      ) : !hasCompletedOnboarding ? (
        // 미로그인 + 온보딩 미완료: 온보딩 화면
        <Stack.Screen name="Onboarding">
          {() => <OnboardingScreen onComplete={handleOnboardingComplete} />}
        </Stack.Screen>
      ) : (
        // 미로그인 + 온보딩 완료: 로그인 화면
        <Stack.Screen 
          name="Auth" 
          component={AuthNavigator} 
        />
      )}
    </Stack.Navigator>
  );
}

/**
 * 루트 네비게이터
 * @function RootNavigator
 * @returns {JSX.Element} 루트 네비게이터
 * @description 네비게이션 컨테이너, 호출 제공자, FCM 초기화 포함
 */
export default function RootNavigator() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const { colors, isDark } = useTheme();
  
  useEffect(() => {
    if (navigationRef.current && Platform.OS !== 'web') {
      navigationService.setNavigationRef(navigationRef.current);
    }
  }, []);

  // 커스텀 네비게이션 테마
  const customTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.PRIMARY,
      background: colors.BACKGROUND,
      card: colors.SURFACE,
      text: colors.TEXT.PRIMARY,
      border: colors.BORDER,
    },
  };

  // 웹과 네이티브 모두 동일한 인증 플로우 사용

  // 네이티브 환경에서는 기존 구조 사용
  return (
    <NavigationContainer ref={navigationRef} theme={customTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}