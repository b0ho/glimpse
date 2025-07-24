/**
 * WebSocket 기반 실시간 채팅 서비스
 * Socket.IO를 사용하여 실시간 메시징 구현
 */

import io, { Socket } from 'socket.io-client';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, ChatRoom } from '@/types';

export interface ChatEvent {
  message: (data: Message) => void;
  messageRead: (data: { messageId: string; readBy: string }) => void;
  typing: (data: { roomId: string; userId: string; isTyping: boolean }) => void;
  userJoined: (data: { roomId: string; userId: string }) => void;
  userLeft: (data: { roomId: string; userId: string }) => void;
  error: (error: string) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private currentUserId: string | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();

  /**
   * WebSocket 연결 초기화
   * @param userId - 현재 사용자 ID
   * @param authToken - 인증 토큰
   */
  async connect(userId: string, authToken: string): Promise<void> {
    if (this.isConnected && this.socket) {
      console.log('WebSocket already connected');
      return;
    }

    this.currentUserId = userId;

    // 개발 환경에서는 로컬 서버, 프로덕션에서는 실제 서버 URL
    const serverUrl = __DEV__ 
      ? 'http://localhost:3000' 
      : 'https://api.glimpse-dating.com';

    this.socket = io(serverUrl, {
      auth: {
        token: authToken,
        userId: userId,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Failed to create socket'));
        return;
      }

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });

      // 채팅 이벤트 핸들러 설정
      this.setupEventHandlers();
    });
  }

  /**
   * WebSocket 연결 해제
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.currentUserId = null;
    this.eventListeners.clear();
  }

  /**
   * 채팅방 참여
   * @param roomId - 채팅방 ID
   */
  joinRoom(roomId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_room', { roomId });
    }
  }

  /**
   * 채팅방 나가기
   * @param roomId - 채팅방 ID
   */
  leaveRoom(roomId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_room', { roomId });
    }
  }

  /**
   * 메시지 전송
   * @param roomId - 채팅방 ID
   * @param content - 메시지 내용
   * @param type - 메시지 타입 (text, image, file)
   */
  async sendMessage(
    roomId: string, 
    content: string, 
    type: 'text' | 'image' | 'file' = 'text'
  ): Promise<Message> {
    if (!this.socket || !this.isConnected) {
      throw new Error('WebSocket is not connected');
    }

    if (!this.currentUserId) {
      throw new Error('User ID is not set');
    }

    const message: Omit<Message, 'id' | 'createdAt'> = {
      roomId,
      senderId: this.currentUserId,
      content,
      type,
      isRead: false,
      readBy: [],
    };

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket is null'));
        return;
      }

      this.socket.emit('send_message', message, (response: { error?: string; message?: Message }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.message!);
        }
      });
    });
  }

  /**
   * 메시지 읽음 표시
   * @param messageId - 메시지 ID
   * @param roomId - 채팅방 ID
   */
  markMessageAsRead(messageId: string, roomId: string): void {
    if (this.socket && this.isConnected && this.currentUserId) {
      this.socket.emit('mark_read', {
        messageId,
        roomId,
        userId: this.currentUserId,
      });
    }
  }

  /**
   * 타이핑 상태 전송
   * @param roomId - 채팅방 ID
   * @param isTyping - 타이핑 중 여부
   */
  sendTypingStatus(roomId: string, isTyping: boolean): void {
    if (this.socket && this.isConnected && this.currentUserId) {
      this.socket.emit('typing', {
        roomId,
        userId: this.currentUserId,
        isTyping,
      });
    }
  }

  /**
   * 이벤트 리스너 등록
   * @param event - 이벤트 이름
   * @param callback - 콜백 함수
   */
  on<K extends keyof ChatEvent>(event: K, callback: ChatEvent[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * 이벤트 리스너 제거
   * @param event - 이벤트 이름
   * @param callback - 제거할 콜백 함수
   */
  off<K extends keyof ChatEvent>(event: K, callback: ChatEvent[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * 연결 상태 확인
   */
  get connected(): boolean {
    return this.isConnected && !!this.socket?.connected;
  }

  /**
   * 현재 사용자 ID 반환
   */
  get userId(): string | null {
    return this.currentUserId;
  }

  /**
   * 채팅방 목록 요청
   */
  async getChatRooms(): Promise<ChatRoom[]> {
    if (!this.socket || !this.isConnected) {
      throw new Error('WebSocket is not connected');
    }

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket is null'));
        return;
      }

      this.socket.emit('get_chat_rooms', (response: { error?: string; rooms?: ChatRoom[] }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.rooms!);
        }
      });
    });
  }

  /**
   * 채팅방 메시지 히스토리 요청
   * @param roomId - 채팅방 ID
   * @param page - 페이지 번호 (기본값: 1)
   * @param limit - 한 페이지당 메시지 수 (기본값: 50)
   */
  async getMessageHistory(
    roomId: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<Message[]> {
    if (!this.socket || !this.isConnected) {
      throw new Error('WebSocket is not connected');
    }

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket is null'));
        return;
      }

      this.socket.emit('get_messages', { roomId, page, limit }, (response: { error?: string; messages?: Message[] }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.messages!);
        }
      });
    });
  }

  /**
   * Socket.IO 이벤트 핸들러 설정
   * @private
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // 새 메시지 수신
    this.socket.on('message', (data: Message) => {
      this.emitToListeners('message', data);
    });

    // 메시지 읽음 상태 업데이트
    this.socket.on('message_read', (data: { messageId: string; readBy: string }) => {
      this.emitToListeners('messageRead', data);
    });

    // 타이핑 상태 수신
    this.socket.on('typing', (data: { roomId: string; userId: string; isTyping: boolean }) => {
      this.emitToListeners('typing', data);
    });

    // 사용자 채팅방 참여
    this.socket.on('user_joined', (data: { roomId: string; userId: string }) => {
      this.emitToListeners('userJoined', data);
    });

    // 사용자 채팅방 나가기
    this.socket.on('user_left', (data: { roomId: string; userId: string }) => {
      this.emitToListeners('userLeft', data);
    });

    // 에러 처리
    this.socket.on('error', (error: string) => {
      console.error('Socket error:', error);
      this.emitToListeners('error', error);
    });
  }

  /**
   * 등록된 리스너들에게 이벤트 전파
   * @private
   */
  private emitToListeners(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }
}

// 싱글톤 인스턴스 생성
export const webSocketService = new WebSocketService();