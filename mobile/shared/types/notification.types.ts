/**
 * 알림 관련 타입 정의
 */

import { User } from './user.types';

/**
 * 알림 타입
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
 * 알림
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
 * 알림 설정
 */
export interface NotificationSettings {
  likes: boolean;
  matches: boolean;
  messages: boolean;
  friendRequests: boolean;
}

/**
 * 사용자 디바이스 토큰 (푸시 알림용)
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