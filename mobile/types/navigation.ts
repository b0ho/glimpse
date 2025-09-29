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
  Auth: undefined;
};

// Interest Stack
export type InterestStackParamList = {
  InterestSearchScreen: undefined;
  AddInterest: undefined;
  MyInfoRegister: undefined;
  MyInfo: undefined;
  Chat: {
    roomId: string;
    matchId: string;
    otherUserNickname: string;
  };
  Premium: undefined;
};

// Main Tab
export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Groups: NavigatorScreenParams<GroupsStackParamList>;
  Interest: NavigatorScreenParams<InterestStackParamList>;
  Matches: NavigatorScreenParams<MatchesStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Home Stack
export type HomeStackParamList = {
  HomeTab: undefined;
  CreateContent: undefined;
  CreateStory: undefined;
  StoryUpload: undefined;
  PostDetail: { postId: string };
  NearbyGroups: undefined;
  NearbyUsers: undefined;
};

// Groups Stack
export type GroupsStackParamList = {
  GroupsTab: undefined;
  CreateGroup: undefined;
  LocationGroup: undefined;
  NearbyUsers: undefined;
  Map: undefined;
  GroupInvite: { groupId: string };
  JoinGroup: { inviteCode?: string };
  GroupManage: { groupId: string };
  GroupDetail: { groupId: string };
};

// Matches Stack
export type MatchesStackParamList = {
  MatchesTab: undefined;
  MatchesScreen: undefined;
  Chat: {
    roomId: string;
    matchId: string;
    otherUserNickname: string;
  };
};

// Profile Stack
export type ProfileStackParamList = {
  ProfileTab: undefined;
  MyGroups: undefined;
  Premium: undefined;
  NotificationSettings: undefined;
  WhoLikesYou: undefined;
  LikeHistory: undefined;
  DeleteAccount: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  Support: undefined;
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