/**
 * 앱 모드 타입 - 데이팅과 친구 찾기 모드를 구분
 * @enum {string}
 */
export enum AppMode {
  /** 데이팅 모드 - 연애 상대를 찾는 모드 */
  DATING = 'DATING',
  /** 친구 찾기 모드 - 친구를 찾는 모드 */
  FRIENDSHIP = 'FRIENDSHIP'
}

/**
 * 사용자 인터페이스 - 모든 사용자 정보를 포함하는 기본 타입
 * @interface User
 */
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
  isAdmin?: boolean; // Admin user flag
  currentMode?: AppMode; // Current app mode (dating or friendship)
  lastActive: Date;
  lastOnline?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Additional profile fields
  companyName?: string;
  education?: string;
  location?: string;
  interests?: string[];
  height?: number;
  mbti?: string;
  drinking?: string;
  smoking?: string;
  
  // Relations
  matches?: Match[];
  friends?: User[];
  groupMemberships?: GroupMember[];
  
  // Settings
  privacySettings?: PrivacySettings;
  notificationSettings?: NotificationSettings;
}

/**
 * 성별 타입
 * @typedef {('MALE'|'FEMALE'|'OTHER')} Gender
 */
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

/**
 * 사용자 생성 요청 인터페이스
 * @interface UserCreateRequest
 */
export interface UserCreateRequest {
  phoneNumber: string;
  nickname: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bio?: string;
}

/**
 * 사용자 정보 업데이트 요청 인터페이스
 * @interface UserUpdateRequest
 */
export interface UserUpdateRequest {
  nickname?: string;
  age?: number;
  bio?: string;
  profileImage?: string;
}

/**
 * 사용자 응답 인터페이스 - API 응답용 확장 타입
 * @interface UserResponse
 * @extends {User}
 */
export interface UserResponse extends User {
  // Additional computed fields for API responses
  premiumUntil?: Date;
  deviceTokens?: UserDeviceToken[];
}

/**
 * 그룹 인터페이스 - 사용자들이 속할 수 있는 그룹 정보
 * @interface Group
 */
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

/**
 * 그룹 타입 열거형
 * @enum {string}
 */
export enum GroupType {
  OFFICIAL = 'OFFICIAL',     // Company/University groups
  CREATED = 'CREATED',       // User-created groups
  INSTANCE = 'INSTANCE',     // Temporary event groups
  LOCATION = 'LOCATION'      // Location-based groups
}

/**
 * 그룹 위치 정보 인터페이스
 * @interface GroupLocation
 */
export interface GroupLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius?: number; // in meters
}

/**
 * 그룹 설정 인터페이스
 * @interface GroupSettings
 */
export interface GroupSettings {
  requiresApproval: boolean;
  allowInvites: boolean;
  isPrivate: boolean;
  ageMin?: number;
  ageMax?: number;
  genderRestriction?: 'MALE_ONLY' | 'FEMALE_ONLY' | 'MIXED';
}

/**
 * 그룹 멤버 인터페이스 - 그룹과 사용자 간의 관계 정보
 * @interface GroupMember
 */
export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: 'MEMBER' | 'ADMIN' | 'CREATOR';
  status: 'ACTIVE' | 'PENDING' | 'BANNED';
  joinedAt: Date;
}

/**
 * 회사/기관 인터페이스
 * @interface Company
 */
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

/**
 * 회사 인증 정보 인터페이스
 * @interface CompanyVerification
 */
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

/**
 * 인증 방법 열거형
 * @enum {string}
 */
export enum VerificationMethod {
  EMAIL_DOMAIN = 'EMAIL_DOMAIN',
  OCR_VERIFICATION = 'OCR_VERIFICATION',
  INVITE_CODE = 'INVITE_CODE',
  HR_APPROVAL = 'HR_APPROVAL'
}

/**
 * 인증 상태 열거형
 * @enum {string}
 */
export enum VerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

/**
 * 좋아요 인터페이스 - 사용자 간 호감 표현 정보
 * @interface Like
 */
export interface Like {
  id: string;
  fromUserId: string;
  toUserId: string;
  groupId: string;
  isAnonymous: boolean;
  isSuper: boolean;
  mode?: AppMode; // Dating or Friendship mode
  createdAt: Date;
  
  // Relations
  fromUser?: User;
  toUser?: User;
  group?: Group;
}

/**
 * 사용자 좋아요 인터페이스 - 하위 호환성을 위한 레거시 타입
 * @interface UserLike
 * @extends {Like}
 * @deprecated Use Like interface instead
 */
export interface UserLike extends Like {
  isMatch: boolean;
}

/**
 * 매칭 인터페이스 - 상호 호감으로 연결된 사용자 정보
 * @interface Match
 */
export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  groupId: string;
  status?: 'ACTIVE' | 'EXPIRED' | 'DELETED';
  isActive: boolean;
  isMutual?: boolean;
  chatChannelId?: string;
  type?: 'DATING' | 'FRIENDSHIP'; // Match type
  matchedAt?: Date; // When match was created
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  user1?: User;
  user2?: User;
  group?: Group;
}

/**
 * 채팅 메시지 인터페이스
 * @interface ChatMessage
 */
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

/**
 * 메시지 인터페이스 - 모바일 호환성을 위한 확장 타입
 * @interface Message
 */
export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string; // Encrypted
  type: 'TEXT' | 'IMAGE' | 'VOICE' | 'LOCATION' | 'STORY_REPLY';
  metadata?: Record<string, any>;
  isRead: boolean;
  isEncrypted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 채팅방 인터페이스
 * @interface ChatRoom
 */
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

/**
 * 콘텐츠 인터페이스 - 사용자가 업로드하는 콘텐츠 정보
 * @interface Content
 */
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

/**
 * 인증 상태 인터페이스 - 사용자 인증 관련 상태 정보
 * @interface AuthState
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * 결제 정보 인터페이스
 * @interface Payment
 */
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

/**
 * 결제 상태 열거형
 * @enum {string}
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

/**
 * 결제 수단 열거형
 * @enum {string}
 */
export enum PaymentMethod {
  CARD = 'CARD',
  KAKAO_PAY = 'KAKAO_PAY',
  TOSS_PAY = 'TOSS_PAY',
  NAVER_PAY = 'NAVER_PAY'
}

/**
 * 알림 인터페이스
 * @interface Notification
 */
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

/**
 * 알림 타입 열거형
 * @enum {string}
 */
export enum NotificationType {
  LIKE_RECEIVED = 'LIKE_RECEIVED',
  MATCH_CREATED = 'MATCH_CREATED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  GROUP_INVITATION = 'GROUP_INVITATION',
  VERIFICATION_APPROVED = 'VERIFICATION_APPROVED',
  VERIFICATION_REJECTED = 'VERIFICATION_REJECTED'
}

/**
 * API 응답 인터페이스 - 표준화된 API 응답 형식
 * @interface ApiResponse
 * @template T - 응답 데이터 타입
 */
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

/**
 * 웹소켓 메시지 인터페이스
 * @interface SocketMessage
 */
export interface SocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
}

/**
 * 타이핑 이벤트 인터페이스 - 채팅 중 타이핑 표시를 위한 이벤트
 * @interface TypingEvent
 */
export interface TypingEvent {
  matchId: string;
  userId: string;
  isTyping: boolean;
}

/**
 * 위치 체크인 인터페이스 - GPS 또는 QR코드를 통한 위치 확인
 * @interface LocationCheckIn
 */
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

/**
 * 사용자 디바이스 토큰 인터페이스 - 푸시 알림을 위한 FCM 토큰 정보
 * @interface UserDeviceToken
 */
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

/**
 * 친구 요청 인터페이스
 * @interface FriendRequest
 */
export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  fromUser?: User;
  toUser?: User;
}

/**
 * 개인정보 설정 인터페이스
 * @interface PrivacySettings
 */
export interface PrivacySettings {
  showProfile: boolean;
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  allowFriendRequests: boolean;
}

/**
 * 알림 설정 인터페이스
 * @interface NotificationSettings
 */
export interface NotificationSettings {
  likes: boolean;
  matches: boolean;
  messages: boolean;
  friendRequests: boolean;
}

/**
 * 프로필 업데이트 데이터 인터페이스
 * @interface UpdateProfileData
 */
export interface UpdateProfileData {
  nickname?: string;
  bio?: string;
  age?: number;
  gender?: Gender;
  companyName?: string;
  education?: string;
  location?: string;
  interests?: string[];
  height?: number;
  mbti?: string;
  drinking?: string;
  smoking?: string;
}

/**
 * 프로필 업데이트 응답 인터페이스
 * @interface ProfileUpdateResponse
 */
export interface ProfileUpdateResponse {
  success: boolean;
  data?: User;
  message?: string;
}

/**
 * 익명 사용자 정보 인터페이스 - 프라이버시 보호를 위한 익명화된 사용자 정보
 * @interface AnonymousUserInfo
 */
export interface AnonymousUserInfo {
  id: string;
  anonymousId: string;
  displayName: string;
  nickname: string;
  realName?: string;
  isMatched: boolean;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

/**
 * 익명 ID를 가진 사용자 인터페이스 - 프라이버시 보호를 위한 확장 타입
 * @interface UserWithAnonymousId
 * @extends {User}
 */
export interface UserWithAnonymousId extends User {
  anonymousId: string;
  realName?: string;
}

/**
 * 근처 사용자 인터페이스 - 위치 기반 매칭을 위한 확장 타입
 * @interface NearbyUser
 * @extends {User}
 */
export interface NearbyUser extends User {
  anonymousId: string;
  distance: number;
  lastSeen: string;
  isOnline: boolean;
  commonGroups: string[];
}

/**
 * 커뮤니티 게시글 인터페이스
 * @interface CommunityPost
 */
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

/**
 * 댓글 인터페이스
 * @interface Comment
 */
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

/**
 * 게시글 좋아요 인터페이스
 * @interface PostLike
 */
export interface PostLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}

/**
 * 그룹 채팅 인터페이스
 * @interface GroupChat
 */
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

/**
 * 그룹 채팅 멤버 인터페이스
 * @interface GroupChatMember
 */
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

/**
 * 그룹 채팅 메시지 인터페이스
 * @interface GroupChatMessage
 */
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

/**
 * 모드별 UI 텍스트 매핑 인터페이스 - 데이팅/친구 모드에 따른 UI 텍스트 변경
 * @interface ModeTexts
 */
export interface ModeTexts {
  like: string;
  match: string;
  matchList: string;
  profileAction: string;
  sendRequest: string;
  requestSent: string;
  viewProfile: string;
}

/**
 * 모드별 UI 텍스트 상수 - 데이팅/친구 모드에 따른 UI 텍스트 정의
 * @constant {Record<AppMode, ModeTexts>}
 */
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