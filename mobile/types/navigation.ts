import { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  // Instant Meeting Screens
  InstantMeeting: undefined;
  JoinInstantMeeting: { code: string };
  UpdateFeatures: { meetingId: string };
  InstantMatches: { meetingId: string };
};

// Auth Stack
export type AuthStackParamList = {
  AuthScreen: undefined;
  PhoneVerification: undefined;
  SMSVerification: { phoneNumber: string };
  NicknameSetup: undefined;
  CompanyVerification: undefined;
};

// Main Tab
export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Groups: NavigatorScreenParams<GroupsStackParamList>;
  Matches: NavigatorScreenParams<MatchesStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Home Stack
export type HomeStackParamList = {
  HomeScreen: undefined;
  CreateContent: undefined;
  StoryUpload: undefined;
};

// Groups Stack
export type GroupsStackParamList = {
  GroupsScreen: undefined;
  GroupDetail: { groupId: string };
  CreateGroup: undefined;
  JoinGroup: { inviteCode?: string };
  GroupInvite: { groupId: string };
  GroupManage: { groupId: string };
  LocationGroup: undefined;
  NearbyUsers: undefined;
  MapScreen: undefined;
};

// Matches Stack
export type MatchesStackParamList = {
  MatchesScreen: undefined;
  Chat: {
    roomId: string;
    matchId: string;
    otherUserNickname: string;
  };
};

// Profile Stack
export type ProfileStackParamList = {
  ProfileScreen: undefined;
  EditProfile: undefined;
  Premium: undefined;
  MyGroups: undefined;
  NotificationSettings: undefined;
  WhoLikesYou: undefined;
  Settings: undefined;
};

// Navigation Props Types
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// Root Navigation
export type RootNavigationProp = StackNavigationProp<RootStackParamList>;

// Screen Props
export type InstantMeetingScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'InstantMeeting'>;
  route: RouteProp<RootStackParamList, 'InstantMeeting'>;
};

export type JoinInstantMeetingScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'JoinInstantMeeting'>;
  route: RouteProp<RootStackParamList, 'JoinInstantMeeting'>;
};