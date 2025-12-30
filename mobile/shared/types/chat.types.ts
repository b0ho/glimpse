/**
 * 채팅 관련 타입 정의
 */

import { User } from './user.types';

/**
 * 채팅 메시지
 */
export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  sender?: User;
  content: string;
  type: 'text' | 'image' | 'video' | 'voice' | 'file' | 'system';
  mediaUrl?: string;
  isRead: boolean;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 메시지 (호환성)
 */
export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderNickname?: string;
  content: string;
  type: 'text' | 'image' | 'voice' | 'system';
  imageUrl?: string;
  voiceUrl?: string;
  /** 음성 메시지 길이 (초) */
  duration?: number;
  isRead: boolean;
  isEncrypted?: boolean;
  timestamp: Date;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * 채팅방
 */
export interface ChatRoom {
  id: string;
  participants: string[];
  participantDetails?: User[];
  lastMessage?: ChatMessage;
  lastMessageAt?: Date;
  unreadCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 소켓 메시지
 */
export interface SocketMessage {
  type: 'chat' | 'typing' | 'read' | 'presence';
  roomId: string;
  data: any;
  timestamp: Date;
}

/**
 * 타이핑 이벤트
 */
export interface TypingEvent {
  roomId: string;
  userId: string;
  isTyping: boolean;
  timestamp: Date;
}