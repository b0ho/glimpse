// 기본 사용자 타입
export interface User {
  id: string;
  anonymousId: string; // 익명 식별자
  nickname: string;
  phoneNumber?: string; // 해시화된 전화번호
  isVerified: boolean;
  createdAt: Date;
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
  createdAt: Date;
}

// 매칭
export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  groupId: string;
  matchedAt: Date;
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