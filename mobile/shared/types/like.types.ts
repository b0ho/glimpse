/**
 * 좋아요 및 매칭 관련 타입 정의
 */

import { User } from './user.types';
import { RelationshipIntent } from './common.types';

/**
 * 좋아요
 */
export interface Like {
  id: string;
  fromUserId: string;
  fromUser?: User;
  toUserId: string;
  toUser?: User;
  groupId?: string;
  isSuper: boolean;
  message?: string;
  intent?: RelationshipIntent;
  isAnonymous: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 사용자 좋아요 (확장)
 */
export interface UserLike extends Like {
  userProfile?: User;
  isMatched?: boolean;
}

/**
 * 매칭
 */
export interface Match {
  id: string;
  user1Id: string;
  user1?: User;
  user2Id: string;
  user2?: User;
  matchedUser?: User;
  groupId?: string;
  chatRoomId?: string;
  isActive: boolean;
  status?: string;
  matchedAt?: Date;
  lastInteraction?: Date;
  lastMessageAt?: Date | null;
  matchType?: 'DATING' | 'FRIEND';
  compatibilityScore?: number;
  commonInterests?: string[];
  user1RevealedAt?: Date;
  user2RevealedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 친구 요청
 */
export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUser?: User;
  toUserId: string;
  toUser?: User;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}