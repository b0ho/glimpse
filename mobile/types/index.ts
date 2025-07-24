// 성별 타입
export type Gender = 'MALE' | 'FEMALE';

// 기본 사용자 타입
export interface User {
  id: string;
  anonymousId: string; // 익명 식별자
  nickname: string; // 익명 닉네임 (매칭 전 공개)
  realName?: string; // 실제 이름 (매칭 후에만 공개)
  age?: number;
  gender?: Gender; // 사용자 성별 (매칭에 필수)
  phoneNumber?: string; // 해시화된 전화번호
  bio?: string;
  profileImage?: string;
  isVerified: boolean;
  isPremium?: boolean;
  credits?: number;
  lastActive?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

// 근처 사용자 타입 (위치 기반 매칭용)
export interface NearbyUser extends User {
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
  gender?: Gender;
}

// 그룹 타입 열거형
export enum GroupType {
  OFFICIAL = 'OFFICIAL', // 공식 그룹 (회사/대학)
  CREATED = 'CREATED',   // 생성 그룹 (사용자 생성)
  INSTANCE = 'INSTANCE', // 인스턴스 그룹 (일회성 이벤트)
  LOCATION = 'LOCATION', // 장소기반 그룹
}

// 그룹 인터페이스
export interface Group {
  id: string;
  name: string;
  type: GroupType;
  description?: string;
  memberCount: number;
  maleCount: number;
  femaleCount: number;
  minimumMembers: number;
  isMatchingActive: boolean;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  expiresAt?: Date; // 인스턴스 그룹용
  createdBy?: string;
  createdAt: Date;
}

// 좋아요 시스템
export interface Like {
  id: string;
  fromUserId: string;
  toUserId: string;
  groupId: string;
  isAnonymous: boolean;
  isSuper: boolean; // 슈퍼 좋아요 여부
  createdAt: Date;
}

// 매칭
export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  groupId: string;
  createdAt: Date; // 매치 생성 시간
  matchedAt?: Date; // 매치된 시간 (별도 관리 가능)
  lastMessageAt?: Date | null; // 마지막 메시지 시간
  isActive: boolean; // 활성 상태
  chatChannelId?: string;
}

// 채팅 메시지
export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string;
  content: string; // 암호화된 내용
  timestamp: Date;
  isRead: boolean;
}

// 실시간 채팅 메시지 (WebSocket용)
export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderNickname?: string; // 발신자 닉네임 (알림용)
  content: string;
  type: 'text' | 'image' | 'file';
  isRead: boolean;
  readBy: string[];
  createdAt: Date;
}

// 채팅방
export interface ChatRoom {
  id: string;
  matchId: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// 회사 인증
export interface CompanyVerification {
  id: string;
  userId: string;
  companyName: string;
  verificationMethod: 'EMAIL' | 'DOCUMENT' | 'INVITE_CODE' | 'MANUAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: Date;
  approvedAt?: Date;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 인증 상태
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// 네비게이션 타입
export type RootStackParamList = {
  Onboarding: undefined;
  PhoneVerification: undefined;
  SMSVerification: { phoneNumber: string };
  NicknameSetup: undefined;
  CompanyVerification: undefined;
  Main: undefined;
  Groups: undefined;
  GroupDetail: { groupId: string };
  Chat: { matchId: string };
  Profile: undefined;
  Settings: undefined;
};

// 콘텐츠 타입 열거형
export type ContentType = 'text' | 'image' | 'mixed';

// 콘텐츠 타입
export interface Content {
  id: string;
  authorId: string;
  authorNickname: string;
  groupId: string;
  type: ContentType;
  text?: string;
  imageUrls?: string[];
  likeCount: number;
  isLikedByUser: boolean;
  createdAt: Date;
}

// 콘텐츠 생성 요청
export interface CreateContentRequest {
  groupId: string;
  type: 'text' | 'image' | 'mixed';
  text?: string;
  imageFiles?: string[]; // base64 또는 파일 경로
}

// 환경 변수 타입
export interface EnvConfig {
  CLERK_PUBLISHABLE_KEY: string;
  API_BASE_URL: string;
  SOCKET_URL: string;
  ENCRYPTION_KEY: string;
}