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
// import { useAuth } from '@clerk/clerk-expo';
import { useAuth } from '@/hooks/useDevAuth';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { NAVIGATION_ICONS } from '@/utils/icons';
// import { CallProvider } from '@/providers/CallProvider';
import { navigationService } from '@/services/navigation/navigationService';
import { initializeFCM, cleanupFCM } from '@/services/notifications/initializeFCM';
import { useAuthStore } from '@/store/slices/authSlice';
import { AppMode, MODE_TEXTS } from '@shared/types';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';

// Screens
import { AuthScreen } from '@/screens/auth/AuthScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { GroupsScreen } from '@/screens/GroupsScreen';
import { MatchChatListScreen } from '@/screens/MatchChatListScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { CreateContentScreen } from '@/screens/CreateContentScreen';
import { CreateStoryScreen } from '@/screens/CreateStoryScreen';
import { CreateGroupScreen } from '@/screens/CreateGroupScreen';
import { MyGroupsScreen } from '@/screens/MyGroupsScreen';
import { ChatScreenSimple as ChatScreen } from '@/screens/ChatScreenSimple';
import { PremiumScreen } from '@/screens/PremiumScreen';
import { LocationGroupScreen } from '@/screens/LocationGroupScreen';
import { NearbyUsersScreen } from '@/screens/NearbyUsersScreen';
import { MapScreen } from '@/screens/MapScreen';
import { NotificationSettingsScreen } from '@/screens/NotificationSettingsScreen';
import { WhoLikesYouScreen } from '@/screens/WhoLikesYouScreen';
import { StoryUploadScreen } from '@/screens/StoryUploadScreen';
import { GroupInviteScreen } from '@/screens/GroupInviteScreen';
import { JoinGroupScreen } from '@/screens/JoinGroupScreen';
import { GroupManageScreen } from '@/screens/GroupManageScreen';
import { ModeSelectionScreen } from '@/screens/ModeSelectionScreen';
import { CommunityScreen } from '@/screens/community/CommunityScreen';
import { GroupChatListScreen } from '@/screens/groupchat/GroupChatListScreen';
import { LikeHistoryScreen } from '@/screens/LikeHistoryScreen';
import { DeleteAccountScreen } from '@/screens/DeleteAccountScreen';
import { InterestSearchScreen } from '@/screens/InterestSearchScreen';
import { AddInterestScreen } from '@/screens/AddInterestScreen';
import { MyInfoScreen } from '@/screens/MyInfoScreen';
import { GroupDetailScreen } from '@/screens/GroupDetailScreen';
// import { RootStackParamList } from '@/types';

/**
 * 네비게이션 타입 정의
 * @description 각 스택과 탭에서 사용되는 파라미터 타입
 */

/** 인증 스택 파라미터 */
type AuthStackParamList = {
  Auth: undefined;
};

type HomeStackParamList = {
  HomeTab: undefined;
  CreateContent: undefined;
  CreateStory: undefined;
  StoryUpload: undefined;
};

type GroupsStackParamList = {
  GroupsTab: undefined;
  CreateGroup: undefined;
  LocationGroup: undefined;
  NearbyUsers: undefined;
  Map: undefined;
  GroupInvite: { groupId: string };
  JoinGroup: { inviteCode: string };
  GroupManage: { groupId: string };
  GroupDetail: { groupId: string };
};

type ProfileStackParamList = {
  ProfileTab: undefined;
  MyGroups: undefined;
  Premium: undefined;
  NotificationSettings: undefined;
  WhoLikesYou: undefined;
  LikeHistory: undefined;
  DeleteAccount: undefined;
};

type MatchesStackParamList = {
  MatchesTab: undefined;
  Chat: {
    roomId: string;
    matchId: string;
    otherUserNickname: string;
  };
};

type InterestStackParamList = {
  InterestTab: undefined;
  AddInterest: undefined;
  MyInfo: undefined;
  Chat: {
    roomId: string;
    matchId: string;
    otherUserNickname: string;
  };
  Premium: undefined;
};

type MainTabParamList = {
  Home: undefined;
  Groups: undefined;
  Interest: undefined;
  Matches: undefined;
  Profile: undefined;
  Community: undefined;
  GroupChat: undefined;
  Friends: undefined;
};

/**
 * 루트 네비게이션 파라미터 타입
 * @type RootNavigationParamList
 * @description 전역에서 사용할 통합 네비게이션 타입
 */
export type RootNavigationParamList = MainTabParamList & {
  Chat: {
    roomId: string;
    matchId: string;
    otherUserNickname: string;
  };
  Premium: undefined;
  NotificationSettings: undefined;
  MyGroups: undefined;
  CreateContent: undefined;
  CreateStory: undefined;
  CreateGroup: undefined;
  WhoLikesYou: undefined;
  LikeHistory: undefined;
  DeleteAccount: undefined;
  GroupInvite: { groupId: string };
  JoinGroup: { inviteCode: string };
  GroupManage: { groupId: string };
};

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
  return (
    <AuthStack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <AuthStack.Screen 
        name="Auth" 
        component={AuthScreenWrapper}
        options={{ title: '로그인' }}
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
  const { t } = useTranslation('navigation');
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
          title: '게시물 작성',
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <HomeStack.Screen 
        name="CreateStory" 
        component={CreateStoryScreen} 
        options={{ 
          title: '스토리 만들기',
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <HomeStack.Screen 
        name="StoryUpload" 
        component={StoryUploadScreen} 
        options={{ 
          title: t('screens.storyUpload'),
          headerShown: false,
          presentation: 'modal',
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
  const { t } = useTranslation('navigation');
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
          title: t('screens.createGroup'),
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <GroupsStack.Screen 
        name="LocationGroup" 
        component={LocationGroupScreen} 
        options={{ 
          title: t('screens.locationGroup'),
          headerShown: false,
        }}
      />
      <GroupsStack.Screen 
        name="NearbyUsers" 
        component={NearbyUsersScreen} 
        options={{ 
          title: t('screens.nearbyUsers'),
          headerShown: false,
        }}
      />
      <GroupsStack.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ 
          title: t('screens.map'),
          headerShown: false,
        }}
      />
      <GroupsStack.Screen 
        name="GroupInvite" 
        component={GroupInviteScreen} 
        options={{ 
          title: t('screens.groupInvite'),
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <GroupsStack.Screen 
        name="JoinGroup" 
        component={JoinGroupScreen} 
        options={{ 
          title: t('screens.joinGroup'),
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <GroupsStack.Screen 
        name="GroupManage" 
        component={GroupManageScreen} 
        options={{ 
          title: t('screens.groupManage'),
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <GroupsStack.Screen 
        name="GroupDetail" 
        component={GroupDetailScreen} 
        options={{ 
          title: '그룹 상세',
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
        component={MatchChatListScreen} 
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
  const { t } = useTranslation('navigation');
  
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
        name="InterestTab" 
        component={InterestSearchScreen} 
        options={{ headerShown: false }}
      />
      <InterestStack.Screen 
        name="AddInterest" 
        component={AddInterestScreen} 
        options={{ 
          title: '관심상대 등록',
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <InterestStack.Screen 
        name="MyInfo" 
        component={MyInfoScreen} 
        options={{ 
          title: '내 정보 관리',
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
          title: '내 그룹',
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
    </ProfileStack.Navigator>
  );
}

/**
 * 데이팅 모드 탭 네비게이터
 * @function DatingTabNavigator
 * @returns {JSX.Element} 데이팅 모드 탭 네비게이터
 * @description 연애 목적 사용자를 위한 4개 탭 (홈, 그룹, 매칭, 프로필)
 */
function DatingTabNavigator() {
  const { currentMode } = useAuthStore();
  const modeTexts = MODE_TEXTS[currentMode];
  const { t } = useTranslation('navigation');
  const { colors } = useTheme();
  
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
        tabBarActiveTintColor: colors.PRIMARY,
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
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <Icon name={NAVIGATION_ICONS.HOME} color={color} size={size || 24} />,
          tabBarAccessibilityLabel: t('accessibility.home'),
        }}
      />
      <Tab.Screen 
        name="Groups" 
        component={GroupsStackNavigator}
        options={{
          title: t('tabs.groups'),
          tabBarIcon: ({ color, size }) => <Icon name={NAVIGATION_ICONS.GROUPS} color={color} size={size || 24} />,
          tabBarAccessibilityLabel: t('accessibility.groups'),
        }}
      />
      <Tab.Screen 
        name="Interest" 
        component={InterestStackNavigator}
        options={{
          title: '찾기',
          tabBarIcon: ({ color, size }) => <Icon name="search-outline" color={color} size={size || 24} />,
          tabBarAccessibilityLabel: '관심상대 찾기',
        }}
      />
      <Tab.Screen 
        name="Matches" 
        component={MatchesStackNavigator}
        options={{
          title: '채팅',
          tabBarIcon: ({ color, size }) => <Icon name="chatbubbles-outline" color={color} size={size || 24} />,
          tabBarAccessibilityLabel: '채팅',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator}
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <Icon name={NAVIGATION_ICONS.PROFILE} color={color} size={size || 24} />,
          tabBarAccessibilityLabel: t('accessibility.profile'),
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * 친구 모드 탭 네비게이터
 * @function FriendshipTabNavigator
 * @returns {JSX.Element} 친구 모드 탭 네비게이터
 * @description 친구 찾기 목적 사용자를 위한 5개 탭 (홈, 커뮤니티, 단체채팅, 친구목록, 프로필)
 */
function FriendshipTabNavigator() {
  const { t } = useTranslation('navigation');
  const { colors } = useTheme();
  
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
        tabBarActiveTintColor: colors.SECONDARY || '#4ECDC4',
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
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <Icon name={NAVIGATION_ICONS.HOME} color={color} size={size || 24} />,
          tabBarAccessibilityLabel: t('accessibility.home'),
        }}
      />
      <Tab.Screen 
        name="Community" 
        component={CommunityScreen}
        options={{
          title: t('tabs.community'),
          tabBarIcon: ({ color, size }) => <Icon name="newspaper-outline" color={color} size={size || 24} />,
          tabBarAccessibilityLabel: t('accessibility.community'),
        }}
      />
      <Tab.Screen 
        name="Interest" 
        component={InterestStackNavigator}
        options={{
          title: '찾기',
          tabBarIcon: ({ color, size }) => <Icon name="search-outline" color={color} size={size || 24} />,
          tabBarAccessibilityLabel: '관심상대 찾기',
        }}
      />
      <Tab.Screen 
        name="Friends" 
        component={MatchesStackNavigator}
        options={{
          title: t('tabs.friends'),
          tabBarIcon: ({ color, size }) => <Icon name="people-outline" color={color} size={size || 24} />,
          tabBarAccessibilityLabel: t('accessibility.friends'),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator}
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <Icon name={NAVIGATION_ICONS.PROFILE} color={color} size={size || 24} />,
          tabBarAccessibilityLabel: t('accessibility.profile'),
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * 메인 탭 네비게이터
 * @function MainTabNavigator
 * @returns {JSX.Element} 현재 모드에 따른 탭 네비게이터
 * @description 앱 모드에 따라 데이팅 또는 친구 모드 탭 표시
 */
function MainTabNavigator() {
  const { currentMode } = useAuthStore();
  
  return currentMode === AppMode.DATING ? <DatingTabNavigator /> : <FriendshipTabNavigator />;
}

/**
 * 앱 네비게이터
 * @function AppNavigator
 * @returns {JSX.Element} 앱 네비게이터
 * @description 인증 상태와 모드 선택에 따른 화면 라우팅
 */
function AppNavigator() {
  const { isSignedIn, isLoaded } = useAuth();
  const { currentMode } = useAuthStore();
  const { colors } = useTheme();
  const [hasSelectedMode, setHasSelectedMode] = React.useState(false);

  useEffect(() => {
    // Check if user has selected a mode
    if (isSignedIn && currentMode) {
      setHasSelectedMode(true);
    }
  }, [isSignedIn, currentMode]);

  if (!isLoaded) {
    return null; // 로딩 화면은 App.tsx에서 처리
  }

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
      {isSignedIn ? (
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
      ) : (
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
  const navigationRef = useRef<NavigationContainerRef<RootNavigationParamList>>(null);
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

  // 웹 환경에서는 간단한 네비게이션 구조 사용
  if (Platform.OS === 'web') {
    return (
      <NavigationContainer theme={customTheme}>
        <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // 네이티브 환경에서는 기존 구조 사용
  return (
    <NavigationContainer ref={navigationRef} theme={customTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}