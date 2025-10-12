// Re-export shared types
export * from '../shared/types';

// Mobile-specific types only
// Note: NearbyUser and AnonymousUserInfo are already defined in shared/types

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  status?: number;
  error?: string;
  errorCode?: string;
  timestamp?: string;
  path?: string;
  statusCode?: number;
  errors?: {
    field: string;
    message: string;
  }[];
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