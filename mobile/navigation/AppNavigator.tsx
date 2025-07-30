import React, { useRef, useEffect } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '@clerk/clerk-expo';
import Icon from 'react-native-vector-icons/Ionicons';
import { NAVIGATION_ICONS } from '@/utils/icons';
import { CallProvider } from '@/providers/CallProvider';
import { navigationService } from '@/services/navigation/navigationService';
import { initializeFCM, cleanupFCM } from '@/services/notifications/initializeFCM';
import { useAuthStore } from '@/store/slices/authSlice';
import { AppMode, MODE_TEXTS } from '@shared/types';

// Screens
import { AuthScreen } from '@/screens/auth/AuthScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { GroupsScreen } from '@/screens/GroupsScreen';
import { MatchesScreen } from '@/screens/MatchesScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { CreateContentScreen } from '@/screens/CreateContentScreen';
import { CreateGroupScreen } from '@/screens/CreateGroupScreen';
import { MyGroupsScreen } from '@/screens/MyGroupsScreen';
import { ChatScreen } from '@/screens/ChatScreen';
import { PremiumScreen } from '@/screens/PremiumScreen';
import LocationGroupScreen from '@/screens/LocationGroupScreen';
import { NearbyUsersScreen } from '@/screens/NearbyUsersScreen';
import { MapScreen } from '@/screens/MapScreen';
import NotificationSettingsScreen from '@/screens/NotificationSettingsScreen';
import { WhoLikesYouScreen } from '@/screens/WhoLikesYouScreen';
import { StoryUploadScreen } from '@/screens/StoryUploadScreen';
import { GroupInviteScreen } from '@/screens/GroupInviteScreen';
import { JoinGroupScreen } from '@/screens/JoinGroupScreen';
import { GroupManageScreen } from '@/screens/GroupManageScreen';
import { ModeSelectionScreen } from '@/screens/ModeSelectionScreen';
import { CommunityScreen } from '@/screens/community/CommunityScreen';
import { GroupChatListScreen } from '@/screens/groupchat/GroupChatListScreen';
// import { RootStackParamList } from '@/types';

// Navigation Types
type AuthStackParamList = {
  Auth: undefined;
};

type HomeStackParamList = {
  HomeTab: undefined;
  CreateContent: undefined;
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
};

type ProfileStackParamList = {
  ProfileTab: undefined;
  MyGroups: undefined;
  Premium: undefined;
  NotificationSettings: undefined;
  WhoLikesYou: undefined;
};

type MatchesStackParamList = {
  MatchesTab: undefined;
  Chat: {
    roomId: string;
    matchId: string;
    otherUserNickname: string;
  };
};

type MainTabParamList = {
  Home: undefined;
  Groups: undefined;
  Matches: undefined;
  Profile: undefined;
  Community: undefined;
  GroupChat: undefined;
  Friends: undefined;
};

// Combined navigation type for global use
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
  CreateGroup: undefined;
  WhoLikesYou: undefined;
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
const Tab = createBottomTabNavigator<MainTabParamList>();

// 모든 메인 화면들이 실제 컴포넌트로 구현됨

// AuthScreen 래퍼 컴포넌트
const AuthScreenWrapper = () => {
  const handleAuthCompleted = () => {
    console.log('Authentication completed');
    // 인증 완료 후 자동으로 메인 화면으로 이동 (Clerk가 처리)
  };

  return <AuthScreen onAuthCompleted={handleAuthCompleted} />;
};

// 인증되지 않은 사용자용 네비게이터
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen 
        name="Auth" 
        component={AuthScreenWrapper}
        options={{ title: '로그인' }}
      />
    </AuthStack.Navigator>
  );
}

// Home Stack Navigator
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="CreateContent" 
        component={CreateContentScreen} 
        options={{ 
          title: '새 게시물',
          headerShown: true,
          presentation: 'modal',
        }}
      />
      <HomeStack.Screen 
        name="StoryUpload" 
        component={StoryUploadScreen} 
        options={{ 
          title: '스토리 추가',
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </HomeStack.Navigator>
  );
}

// Groups Stack Navigator
function GroupsStackNavigator() {
  return (
    <GroupsStack.Navigator>
      <GroupsStack.Screen 
        name="GroupsTab" 
        component={GroupsScreen} 
        options={{ headerShown: false }}
      />
      <GroupsStack.Screen 
        name="CreateGroup" 
        component={CreateGroupScreen} 
        options={{ 
          title: '새 그룹 만들기',
          headerShown: true,
          presentation: 'modal',
        }}
      />
      <GroupsStack.Screen 
        name="LocationGroup" 
        component={LocationGroupScreen} 
        options={{ 
          title: '위치 기반 그룹',
          headerShown: false,
        }}
      />
      <GroupsStack.Screen 
        name="NearbyUsers" 
        component={NearbyUsersScreen} 
        options={{ 
          title: '근처 사용자',
          headerShown: false,
        }}
      />
      <GroupsStack.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ 
          title: '지도',
          headerShown: false,
        }}
      />
      <GroupsStack.Screen 
        name="GroupInvite" 
        component={GroupInviteScreen} 
        options={{ 
          title: '그룹 초대',
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <GroupsStack.Screen 
        name="JoinGroup" 
        component={JoinGroupScreen} 
        options={{ 
          title: '그룹 가입',
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <GroupsStack.Screen 
        name="GroupManage" 
        component={GroupManageScreen} 
        options={{ 
          title: '그룹 관리',
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </GroupsStack.Navigator>
  );
}

// Matches Stack Navigator
function MatchesStackNavigator() {
  return (
    <MatchesStack.Navigator>
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

// Profile Stack Navigator
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
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
    </ProfileStack.Navigator>
  );
}

// Dating Mode Tab Navigator
function DatingTabNavigator() {
  const { currentMode } = useAuthStore();
  const modeTexts = MODE_TEXTS[currentMode];
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E9ECEF',
          height: 60,
        },
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#6C757D',
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
          title: '홈',
          tabBarIcon: ({ color, size }) => <Icon name={NAVIGATION_ICONS.HOME} color={color} size={size || 24} />,
          tabBarAccessibilityLabel: '홈 화면으로 이동',
        }}
      />
      <Tab.Screen 
        name="Groups" 
        component={GroupsStackNavigator}
        options={{
          title: '그룹',
          tabBarIcon: ({ color, size }) => <Icon name={NAVIGATION_ICONS.GROUPS} color={color} size={size || 24} />,
          tabBarAccessibilityLabel: '그룹 화면으로 이동',
        }}
      />
      <Tab.Screen 
        name="Matches" 
        component={MatchesStackNavigator}
        options={{
          title: modeTexts.matchList,
          tabBarIcon: ({ color, size }) => <Icon name={NAVIGATION_ICONS.MATCHES} color={color} size={size || 24} />,
          tabBarAccessibilityLabel: '매칭 화면으로 이동',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator}
        options={{
          title: '프로필',
          tabBarIcon: ({ color, size }) => <Icon name={NAVIGATION_ICONS.PROFILE} color={color} size={size || 24} />,
          tabBarAccessibilityLabel: '프로필 화면으로 이동',
        }}
      />
    </Tab.Navigator>
  );
}

// Friendship Mode Tab Navigator
function FriendshipTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E9ECEF',
          height: 60,
        },
        tabBarActiveTintColor: '#4ECDC4',
        tabBarInactiveTintColor: '#6C757D',
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
          title: '홈',
          tabBarIcon: ({ color, size }) => <Icon name={NAVIGATION_ICONS.HOME} color={color} size={size || 24} />,
          tabBarAccessibilityLabel: '홈 화면으로 이동',
        }}
      />
      <Tab.Screen 
        name="Community" 
        component={CommunityScreen}
        options={{
          title: '커뮤니티',
          tabBarIcon: ({ color, size }) => <Icon name="newspaper-outline" color={color} size={size || 24} />,
          tabBarAccessibilityLabel: '커뮤니티 화면으로 이동',
        }}
      />
      <Tab.Screen 
        name="GroupChat" 
        component={GroupChatListScreen}
        options={{
          title: '단체채팅',
          tabBarIcon: ({ color, size }) => <Icon name="chatbubbles-outline" color={color} size={size || 24} />,
          tabBarAccessibilityLabel: '단체채팅 화면으로 이동',
        }}
      />
      <Tab.Screen 
        name="Friends" 
        component={MatchesStackNavigator}
        options={{
          title: '친구목록',
          tabBarIcon: ({ color, size }) => <Icon name="people-outline" color={color} size={size || 24} />,
          tabBarAccessibilityLabel: '친구 목록으로 이동',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator}
        options={{
          title: '프로필',
          tabBarIcon: ({ color, size }) => <Icon name={NAVIGATION_ICONS.PROFILE} color={color} size={size || 24} />,
          tabBarAccessibilityLabel: '프로필 화면으로 이동',
        }}
      />
    </Tab.Navigator>
  );
}

// Main Tab Navigator (mode selector)
function MainTabNavigator() {
  const { currentMode } = useAuthStore();
  
  return currentMode === AppMode.DATING ? <DatingTabNavigator /> : <FriendshipTabNavigator />;
}

// 메인 앱 네비게이터
function AppNavigator() {
  const { isSignedIn, isLoaded } = useAuth();
  const { currentMode } = useAuthStore();
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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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

// 네비게이션 컨테이너를 포함한 루트 네비게이터
export default function RootNavigator() {
  const navigationRef = useRef<NavigationContainerRef<RootNavigationParamList>>(null);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (navigationRef.current) {
      navigationService.setNavigationRef(navigationRef.current);
    }
  }, []);

  useEffect(() => {
    // Initialize FCM when user is signed in
    if (isSignedIn) {
      initializeFCM();
    } else {
      cleanupFCM();
    }
  }, [isSignedIn]);

  return (
    <NavigationContainer ref={navigationRef}>
      <CallProvider>
        <AppNavigator />
      </CallProvider>
    </NavigationContainer>
  );
}