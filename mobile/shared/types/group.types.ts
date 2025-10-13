/**
 * 그룹 관련 타입 정의
 */

import { User } from './user.types';

/**
 * 그룹 타입
 */
export enum GroupType {
  OFFICIAL = 'OFFICIAL',
  CREATED = 'CREATED',
  INSTANCE = 'INSTANCE',
  LOCATION = 'LOCATION'
}

/**
 * 그룹 인터페이스
 */
export interface Group {
  id: string;
  name: string;
  description?: string;
  type: GroupType;
  imageUrl?: string;
  creatorId: string;
  creator?: User;
  memberCount: number;
  members?: GroupMember[];
  maxMembers?: number;
  isPrivate: boolean;
  isVerified?: boolean;
  isActive: boolean;
  isMatchingActive: boolean;
  tags?: string[];
  location?: GroupLocation;
  settings?: GroupSettings;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  inviteCode?: string;
}

/**
 * 그룹 위치 정보
 */
export interface GroupLocation {
  address: string;
  latitude: number;
  longitude: number;
  radius?: number;
}

/**
 * 그룹 설정
 */
export interface GroupSettings {
  minMembers?: number;
  autoMatchingEnabled?: boolean;
  matchingStartTime?: string;
  matchingEndTime?: string;
  requireApproval?: boolean;
}

/**
 * 그룹 멤버
 */
export interface GroupMember {
  id: string;
  userId: string;
  user?: User;
  groupId: string;
  group?: Group;
  role: 'admin' | 'member';
  joinedAt: Date;
  isActive: boolean;
}

/**
 * 그룹 채팅
 */
export interface GroupChat {
  id: string;
  groupId: string;
  group?: Group;
  name: string;
  description?: string;
  imageUrl?: string;
  memberCount?: number;
  members: GroupChatMember[];
  lastMessage?: GroupChatMessage;
  lastMessageAt?: Date;
  unreadCount?: number;
  isPinned: boolean;
  isMuted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 그룹 채팅 멤버
 */
export interface GroupChatMember {
  id: string;
  groupChatId: string;
  userId: string;
  user?: User;
  nickname: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  lastReadAt?: Date;
  isMuted: boolean;
}

/**
 * 그룹 채팅 메시지
 */
export interface GroupChatMessage {
  id: string;
  groupChatId: string;
  senderId: string;
  sender?: GroupChatMember;
  content: string;
  type: 'text' | 'image' | 'video' | 'file' | 'system';
  mediaUrl?: string;
  isEdited: boolean;
  isDeleted: boolean;
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}