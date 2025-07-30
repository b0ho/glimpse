// App Mode Types
export enum AppMode {
  DATING = 'DATING',
  FRIENDSHIP = 'FRIENDSHIP'
}

// User Types
export interface User {
  id: string;
  clerkId?: string;
  anonymousId: string;
  phoneNumber: string;
  nickname?: string;
  realName?: string; // Real name (revealed after matching)
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  profileImage?: string;
  bio?: string;
  isVerified: boolean;
  credits: number;
  isPremium: boolean;
  premiumUntil?: Date;
  currentMode?: AppMode; // Current app mode (dating or friendship)
  lastActive: Date;
  lastOnline?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Gender Type
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface UserCreateRequest {
  phoneNumber: string;
  nickname: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bio?: string;
}

export interface UserUpdateRequest {
  nickname?: string;
  age?: number;
  bio?: string;
  profileImage?: string;
}

export interface UserResponse extends User {
  // Additional computed fields for API responses
  premiumUntil?: Date;
  deviceTokens?: UserDeviceToken[];
}

// Group Types
export interface Group {
  id: string;
  name: string;
  description?: string;
  type: GroupType;
  isActive: boolean;
  memberCount: number;
  maleCount?: number;
  femaleCount?: number;
  maxMembers?: number;
  minimumMembers?: number;
  isMatchingActive?: boolean;
  creatorId?: string;
  companyId?: string;
  location?: GroupLocation;
  settings: GroupSettings;
  expiresAt?: Date; // For instance groups
  createdAt: Date;
  updatedAt: Date;
}

export enum GroupType {
  OFFICIAL = 'OFFICIAL',     // Company/University groups
  CREATED = 'CREATED',       // User-created groups
  INSTANCE = 'INSTANCE',     // Temporary event groups
  LOCATION = 'LOCATION'      // Location-based groups
}

export interface GroupLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius?: number; // in meters
}

export interface GroupSettings {
  requiresApproval: boolean;
  allowInvites: boolean;
  isPrivate: boolean;
  ageMin?: number;
  ageMax?: number;
  genderRestriction?: 'MALE_ONLY' | 'FEMALE_ONLY' | 'MIXED';
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: 'MEMBER' | 'ADMIN' | 'CREATOR';
  status: 'ACTIVE' | 'PENDING' | 'BANNED';
  joinedAt: Date;
}

// Company & Verification Types
export interface Company {
  id: string;
  name: string;
  domain: string;
  type: 'COMPANY' | 'UNIVERSITY' | 'ORGANIZATION';
  isVerified: boolean;
  logo?: string;
  description?: string;
  location?: string;
  createdAt: Date;
}

export interface CompanyVerification {
  id: string;
  userId: string;
  companyId: string;
  method: VerificationMethod;
  status: VerificationStatus;
  data?: Record<string, any>;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export enum VerificationMethod {
  EMAIL_DOMAIN = 'EMAIL_DOMAIN',
  OCR_VERIFICATION = 'OCR_VERIFICATION',
  INVITE_CODE = 'INVITE_CODE',
  HR_APPROVAL = 'HR_APPROVAL'
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

// Like & Match Types
export interface Like {
  id: string;
  fromUserId: string;
  toUserId: string;
  groupId: string;
  isAnonymous: boolean;
  isSuper: boolean;
  mode?: AppMode; // Dating or Friendship mode
  createdAt: Date;
}

// Legacy interface for backwards compatibility
export interface UserLike extends Like {
  isMatch: boolean;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  groupId: string;
  status?: 'ACTIVE' | 'EXPIRED' | 'DELETED';
  isActive: boolean;
  chatChannelId?: string;
  type?: 'DATING' | 'FRIENDSHIP'; // Match type
  matchedAt?: Date; // When match was created
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Chat Types
export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'SYSTEM';
  isEncrypted: boolean;
  readAt?: Date;
  createdAt: Date;
}

// Message Types (for mobile compatibility)
export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string; // Encrypted
  type: 'TEXT' | 'IMAGE' | 'VOICE' | 'LOCATION' | 'STORY_REPLY';
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Chat Room Types
export interface ChatRoom {
  id: string;
  matchId: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Content Types (for mobile compatibility)
export interface Content {
  id: string;
  userId: string;
  authorId?: string; // For compatibility
  authorNickname?: string;
  type: 'PHOTO' | 'VIDEO' | 'STORY' | 'image' | 'text'; // Support legacy types
  mediaUrl?: string;
  imageUrls?: string[];
  text?: string;
  thumbnailUrl?: string;
  caption?: string;
  tags?: string[];
  likes: number;
  likeCount?: number; // Alias for likes
  views: number;
  isPublic: boolean;
  isLikedByUser?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Auth Types
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// Payment Types
export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: 'PREMIUM_SUBSCRIPTION' | 'LIKE_CREDITS';
  status: PaymentStatus;
  method: PaymentMethod;
  stripePaymentId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  CARD = 'CARD',
  KAKAO_PAY = 'KAKAO_PAY',
  TOSS_PAY = 'TOSS_PAY',
  NAVER_PAY = 'NAVER_PAY'
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

export enum NotificationType {
  LIKE_RECEIVED = 'LIKE_RECEIVED',
  MATCH_CREATED = 'MATCH_CREATED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  GROUP_INVITATION = 'GROUP_INVITATION',
  VERIFICATION_APPROVED = 'VERIFICATION_APPROVED',
  VERIFICATION_REJECTED = 'VERIFICATION_REJECTED'
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// WebSocket Types
export interface SocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
}

export interface TypingEvent {
  matchId: string;
  userId: string;
  isTyping: boolean;
}

// Location Types
export interface LocationCheckIn {
  id: string;
  userId: string;
  groupId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  method: 'GPS' | 'QR_CODE';
  isValid: boolean;
  createdAt: Date;
}

// Device Token Types
export interface UserDeviceToken {
  id: string;
  userId: string;
  deviceId: string;
  fcmToken: string;
  platform: 'ios' | 'android' | 'web';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Anonymous User Info for privacy system
export interface AnonymousUserInfo {
  id: string;
  anonymousId: string;
  displayName: string;
  nickname: string;
  realName?: string;
  isMatched: boolean;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

// User with anonymous ID for privacy
export interface UserWithAnonymousId extends User {
  anonymousId: string;
  realName?: string;
}

// Nearby Users for location-based matching
export interface NearbyUser extends User {
  anonymousId: string;
  distance: number;
  lastSeen: string;
  isOnline: boolean;
  commonGroups: string[];
}

// Community Types
export interface CommunityPost {
  id: string;
  authorId: string;
  groupId: string;
  title: string;
  content: string;
  imageUrls?: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isPinned?: boolean;
  category?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  author?: User;
  group?: Group;
  comments?: Comment[];
  likes?: PostLike[];
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentId?: string; // For nested comments
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  author?: User;
  post?: CommunityPost;
  parent?: Comment;
  replies?: Comment[];
}

export interface PostLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}

// Group Chat Types
export interface GroupChat {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  maxMembers: number;
  memberCount: number;
  isPublic: boolean;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  group?: Group;
  members?: GroupChatMember[];
  lastMessage?: GroupChatMessage;
}

export interface GroupChatMember {
  id: string;
  chatId: string;
  userId: string;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
  joinedAt: Date;
  lastReadAt?: Date;
  
  // Relations
  user?: User;
  chat?: GroupChat;
}

export interface GroupChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'SYSTEM' | 'EMOJI';
  isEncrypted: boolean;
  replyToId?: string;
  createdAt: Date;
  
  // Relations
  sender?: User;
  chat?: GroupChat;
  replyTo?: GroupChatMessage;
}

// UI Text Mapping for different modes
export interface ModeTexts {
  like: string;
  match: string;
  matchList: string;
  profileAction: string;
  sendRequest: string;
  requestSent: string;
  viewProfile: string;
}

export const MODE_TEXTS: Record<AppMode, ModeTexts> = {
  [AppMode.DATING]: {
    like: '호감있어요',
    match: '매칭',
    matchList: '매칭 목록',
    profileAction: '프로필 보기',
    sendRequest: '호감 보내기',
    requestSent: '호감을 보냈습니다',
    viewProfile: '프로필 보기'
  },
  [AppMode.FRIENDSHIP]: {
    like: '친해지고 싶어요',
    match: '친구',
    matchList: '친구 목록',
    profileAction: '같이 놀기',
    sendRequest: '친구 신청',
    requestSent: '친구 신청을 보냈습니다',
    viewProfile: '프로필 보기'
  }
};