// User Types
export interface User {
  id: string;
  phoneNumber: string;
  nickname?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  profileImage?: string;
  bio?: string;
  isVerified: boolean;
  credits: number;
  isPremium: boolean;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

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
  maxMembers?: number;
  creatorId?: string;
  companyId?: string;
  location?: GroupLocation;
  settings: GroupSettings;
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
export interface UserLike {
  id: string;
  fromUserId: string;
  toUserId: string;
  groupId: string;
  isMatch: boolean;
  createdAt: Date;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  groupId: string;
  status: 'ACTIVE' | 'EXPIRED' | 'DELETED';
  createdAt: Date;
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