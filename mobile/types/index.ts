// Re-export shared types
export * from '@shared/types';

// Mobile-specific types only

// 근처 사용자 타입 (위치 기반 매칭용)
export interface NearbyUser {
  id: string;
  anonymousId: string;
  nickname: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  distance: number;
  lastSeen: string;
  isOnline: boolean;
  commonGroups: string[];
}

// 익명성 컨텍스트별 사용자 정보
export interface AnonymousUserInfo {
  id: string;
  anonymousId: string;
  displayName: string; // 매칭 상태에 따라 nickname 또는 realName
  nickname: string;
  realName?: string; // 매칭된 경우에만 포함
  isMatched: boolean;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

// Mobile UI specific types
export interface NavigationParams {
  ChatScreen: { matchId: string };
  GroupDetailScreen: { groupId: string };
  ProfileScreen: { userId?: string };
  StoryViewerScreen: { storyId: string };
}

// Push notification types
export interface PushNotificationData {
  type: 'match' | 'message' | 'like' | 'story_view';
  targetId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

// Media upload types
export interface MediaUpload {
  uri: string;
  type: 'image' | 'video';
  name: string;
  size: number;
  duration?: number; // for videos
}

// Voice message types
export interface VoiceMessage {
  id: string;
  uri: string;
  duration: number;
  waveform?: number[];
}

// Story viewer info
export interface StoryViewerInfo {
  viewerId: string;
  viewerNickname: string;
  viewedAt: Date;
  isAnonymous: boolean;
}

// Call state types
export interface CallState {
  isInCall: boolean;
  callType?: 'voice' | 'video';
  remoteUserId?: string;
  localStream?: any; // MediaStream type
  remoteStream?: any; // MediaStream type
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed';
}