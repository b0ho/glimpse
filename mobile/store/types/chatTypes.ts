/**
 * 채팅 관련 타입 정의
 */

import { Message, ChatRoom } from '@/types';

/**
 * 타이핑 중인 사용자 정보
 */
export interface TypingUser {
  userId: string;
  nickname: string;
  roomId: string;
  timestamp: number;
}

/**
 * 오프라인 메시지
 */
export interface OfflineMessage {
  roomId: string;
  content: string;
  type: 'TEXT' | 'IMAGE';
  timestamp: number;
}

/**
 * 연결 상태
 */
export interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastConnectedAt: number | null;
}

/**
 * 채팅 상태
 */
export interface ChatState {
  chatRooms: ChatRoom[];
  messages: Record<string, Message[]>;
  activeRoomId: string | null;
  typingUsers: TypingUser[];
  isLoading: boolean;
  error: string | null;
  connectionState: ConnectionState;
  offlineMessageQueue: OfflineMessage[];
}

/**
 * 채팅 액션
 */
export interface ChatActions {
  // WebSocket 연결 및 초기화
  initializeChat: (userId: string, authToken: string) => Promise<void>;
  
  // 채팅방 관련
  loadChatRooms: () => Promise<void>;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  setActiveRoom: (roomId: string | null) => void;
  
  // 메시지 관련
  loadMessages: (roomId: string, page?: number) => Promise<void>;
  sendMessage: (roomId: string, content: string, type?: 'TEXT' | 'IMAGE' | 'VOICE' | 'LOCATION' | 'STORY_REPLY') => Promise<void>;
  addMessage: (message: Message) => void;
  markMessageAsRead: (messageId: string, roomId: string) => void;
  processOfflineMessages: () => void;
  
  // 타이핑 관련
  setTypingStatus: (roomId: string, isTyping: boolean) => void;
  addTypingUser: (user: TypingUser) => void;
  removeTypingUser: (userId: string, roomId: string) => void;
  
  // 연결 상태 관련
  setConnectionState: (state: Partial<ConnectionState>) => void;
  
  // 오프라인 큐 관련
  addToOfflineQueue: (message: OfflineMessage) => void;
  clearOfflineQueue: () => void;
  
  // 정리
  cleanup: () => void;
  reset: () => void;
}

export type ChatStore = ChatState & ChatActions;