import { socketService } from './socketService';
import apiClient from '../api/config';
import { Message, ChatRoom } from '@/types';
import { EncryptionService } from '../encryptionService';
import { generateDummyChatMessages } from '@/utils/mockData';

/**
 * 암호화 서비스 인스턴스
 * @constant {EncryptionService}
 * @private
 */
const encryptionService = new EncryptionService();

/**
 * 채팅 서비스 인터페이스
 * @interface ChatServiceInterface
 * @description 실시간 채팅, 메시지 관리, 온라인 상태 관리 기능 정의
 */
interface ChatServiceInterface {
  /** 연결 관리 */
  connect(userId: string, authToken: string): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;

  /** 채팅방 관리 */
  joinMatch(matchId: string): void;
  leaveMatch(matchId: string): void;

  /** 메시징 */
  sendMessage(matchId: string, content: string, type?: 'TEXT' | 'IMAGE'): void;
  markAsRead(matchId: string, messageIds: string[]): void;

  /** 타이핑 표시 */
  startTyping(matchId: string): void;
  stopTyping(matchId: string): void;

  /** 온라인 상태 */
  getOnlineStatus(userIds: string[]): void;

  /** API 호출 */
  getMatches(): Promise<ChatRoom[]>;
  getMessages(matchId: string, page?: number, limit?: number): Promise<Message[]>;
  uploadImage(matchId: string, imageUri: string): Promise<string>;

  /** 이벤트 리스너 */
  onNewMessage(callback: (data: { matchId: string; message: Message }) => void): void;
  onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void): void;
  onMessagesRead(callback: (data: { matchId: string; messageIds: string[]; readBy: string }) => void): void;
  onUserJoined(callback: (data: { userId: string }) => void): void;
  onUserLeft(callback: (data: { userId: string }) => void): void;
  onUserOffline(callback: (data: { userId: string }) => void): void;
  onOnlineStatus(callback: (data: Array<{ userId: string; isOnline: boolean }>) => void): void;
  onError(callback: (data: { message: string }) => void): void;

  /** 정리 */
  removeAllListeners(): void;
}

/**
 * 채팅 서비스 클래스
 * @class ChatService
 * @implements {ChatServiceInterface}
 * @description WebSocket 기반 실시간 채팅 서비스 구현
 */
class ChatService implements ChatServiceInterface {
  /**
   * 이벤트 리스너 맵
   * @private
   * @type {Map<string, Function[]>}
   */
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  /**
   * WebSocket 연결
   * @async
   * @param {string} userId - 사용자 ID
   * @param {string} authToken - 인증 토큰
   * @returns {Promise<void>}
   * @description Socket.IO 서버에 연결하고 이벤트 리스너 설정
   */
  async connect(userId: string, authToken: string): Promise<void> {
    await socketService.connect(userId, authToken);
    this.setupEventListeners();
  }

  /**
   * WebSocket 연결 해제
   * @description 모든 리스너를 제거하고 소켓 연결을 종료
   */
  disconnect(): void {
    this.removeAllListeners();
    socketService.disconnect();
  }

  /**
   * 연결 상태 확인
   * @returns {boolean} 연결 여부
   * @description 현재 WebSocket 연결 상태를 반환
   */
  isConnected(): boolean {
    return socketService.getSocket()?.connected || false;
  }

  /**
   * 매칭 채팅방 참여
   * @param {string} matchId - 매칭 ID
   * @description 특정 매칭의 채팅방에 참여
   */
  joinMatch(matchId: string): void {
    socketService.emit('join-match', matchId);
  }

  /**
   * 매칭 채팅방 퇴장
   * @param {string} matchId - 매칭 ID
   * @description 특정 매칭의 채팅방에서 퇴장
   */
  leaveMatch(matchId: string): void {
    socketService.emit('leave-match', matchId);
  }

  /**
   * 메시지 전송
   * @async
   * @param {string} matchId - 매칭 ID
   * @param {string} content - 메시지 내용
   * @param {'TEXT' | 'IMAGE'} [type='TEXT'] - 메시지 유형
   * @returns {Promise<void>}
   * @description 메시지를 암호화하여 전송
   */
  async sendMessage(matchId: string, content: string, type: 'TEXT' | 'IMAGE' = 'TEXT'): Promise<void> {
    // 개발 환경에서는 mock 동작
    if (__DEV__) {
      console.log('[chatService] Mock 메시지 전송:', { matchId, content, type });
      // 실제 전송 대신 로컬에서 시뮬레이션
      return;
    }

    // Encrypt message content
    const encryptedContent = await encryptionService.encryptMessage(content);
    
    socketService.emit('send-message', {
      matchId,
      content: encryptedContent,
      type
    });
  }

  /**
   * 메시지 읽음 처리
   * @param {string} matchId - 매칭 ID
   * @param {string[]} messageIds - 읽음 처리할 메시지 ID 배열
   * @description 여러 메시지를 읽음 상태로 변경
   */
  markAsRead(matchId: string, messageIds: string[]): void {
    socketService.emit('mark-as-read', {
      matchId,
      messageIds
    });
  }

  /**
   * 타이핑 시작 알림
   * @param {string} matchId - 매칭 ID
   * @description 상대방에게 타이핑 중임을 알림
   */
  startTyping(matchId: string): void {
    socketService.emit('typing-start', matchId);
  }

  /**
   * 타이핑 종료 알림
   * @param {string} matchId - 매칭 ID
   * @description 상대방에게 타이핑 종료를 알림
   */
  stopTyping(matchId: string): void {
    socketService.emit('typing-stop', matchId);
  }

  /**
   * 온라인 상태 조회
   * @param {string[]} userIds - 조회할 사용자 ID 배열
   * @description 여러 사용자의 온라인 상태를 요청
   */
  getOnlineStatus(userIds: string[]): void {
    socketService.emit('get-online-status', userIds);
  }

  /**
   * 매칭 목록 조회
   * @async
   * @returns {Promise<ChatRoom[]>} 채팅방 목록
   * @throws {Error} API 호출 실패 시
   * @description 현재 사용자의 모든 매칭(채팅방) 목록을 가져오기
   */
  async getMatches(): Promise<ChatRoom[]> {
    try {
      const response = await apiClient.get<{ data: ChatRoom[] }>('/matches');
      return response.data;
    } catch (error) {
      console.error('Failed to get matches:', error);
      throw error;
    }
  }

  /**
   * 메시지 목록 조회
   * @async
   * @param {string} matchId - 매칭 ID
   * @param {number} [page=1] - 페이지 번호
   * @param {number} [limit=20] - 페이지당 메시지 수
   * @returns {Promise<Message[]>} 메시지 목록
   * @throws {Error} API 호출 실패 시
   * @description 특정 채팅방의 메시지를 페이지네이션하여 조회하고 복호화
   */
  async getMessages(matchId: string, page = 1, limit = 20): Promise<Message[]> {
    try {
      // 개발 환경에서는 mock 데이터 사용
      if (__DEV__) {
        console.log('[chatService] Mock 메시지 데이터 로드 for matchId:', matchId);
        await new Promise(resolve => setTimeout(resolve, 300)); // 로딩 시뮬레이션
        const mockMessages = generateDummyChatMessages(matchId);
        console.log('[chatService] Mock 메시지 반환:', mockMessages.length, '개');
        return mockMessages;
      }

      const response = await apiClient.get<{ data: Message[] }>(`/matches/${matchId}/messages`, { page, limit });
      
      // Decrypt messages
      const messages = response.data;
      for (const message of messages) {
        if (message.isEncrypted && message.type === 'TEXT') {
          try {
            message.content = await encryptionService.decryptMessage(message.content);
          } catch (error) {
            console.error('Failed to decrypt message:', error);
            message.content = '[메시지를 복호화할 수 없습니다]';
          }
        }
      }
      
      return messages;
    } catch (error) {
      console.error('Failed to get messages:', error);
      throw error;
    }
  }

  /**
   * 이미지 업로드
   * @async
   * @param {string} matchId - 매칭 ID
   * @param {string} imageUri - 이미지 URI
   * @returns {Promise<string>} 업로드된 이미지 URL
   * @throws {Error} 업로드 실패 시
   * @description 채팅용 이미지를 서버에 업로드하고 URL 반환
   */
  async uploadImage(matchId: string, imageUri: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);
      formData.append('matchId', matchId);

      const response = await apiClient.post<{ data: { url: string } }>('/upload/chat-image', formData);

      return response.data.url;
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw error;
    }
  }

  /**
   * 새 메시지 이벤트 리스너
   * @param {Function} callback - 콜백 함수
   * @description 새 메시지 수신 시 복호화 후 콜백 실행
   */
  onNewMessage(callback: (data: { matchId: string; message: Message }) => void): void {
    this.addEventListener('new-message', async (data: any) => {
      // Decrypt message if needed
      if (data.message.isEncrypted && data.message.type === 'TEXT') {
        try {
          data.message.content = await encryptionService.decryptMessage(data.message.content);
        } catch (error) {
          console.error('Failed to decrypt message:', error);
          data.message.content = '[메시지를 복호화할 수 없습니다]';
        }
      }
      callback(data);
    });
  }

  /**
   * 타이핑 상태 이벤트 리스너
   * @param {Function} callback - 콜백 함수
   * @description 사용자의 타이핑 상태 변경 시 콜백 실행
   */
  onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void): void {
    this.addEventListener('user-typing', callback);
  }

  /**
   * 메시지 읽음 이벤트 리스너
   * @param {Function} callback - 콜백 함수
   * @description 메시지가 읽힘 처리될 때 콜백 실행
   */
  onMessagesRead(callback: (data: { matchId: string; messageIds: string[]; readBy: string }) => void): void {
    this.addEventListener('messages-read', callback);
  }

  /**
   * 사용자 참여 이벤트 리스너
   * @param {Function} callback - 콜백 함수
   * @description 새 사용자가 채팅방에 참여할 때 콜백 실행
   */
  onUserJoined(callback: (data: { userId: string }) => void): void {
    this.addEventListener('user-joined', callback);
  }

  /**
   * 사용자 퇴장 이벤트 리스너
   * @param {Function} callback - 콜백 함수
   * @description 사용자가 채팅방을 떠날 때 콜백 실행
   */
  onUserLeft(callback: (data: { userId: string }) => void): void {
    this.addEventListener('user-left', callback);
  }

  /**
   * 사용자 오프라인 이벤트 리스너
   * @param {Function} callback - 콜백 함수
   * @description 사용자가 오프라인 상태가 될 때 콜백 실행
   */
  onUserOffline(callback: (data: { userId: string }) => void): void {
    this.addEventListener('user-offline', callback);
  }

  /**
   * 온라인 상태 이벤트 리스너
   * @param {Function} callback - 콜백 함수
   * @description 사용자들의 온라인 상태 정보 수신 시 콜백 실행
   */
  onOnlineStatus(callback: (data: Array<{ userId: string; isOnline: boolean }>) => void): void {
    this.addEventListener('online-status', callback);
  }

  /**
   * 에러 이벤트 리스너
   * @param {Function} callback - 콜백 함수
   * @description 채팅 관련 에러 발생 시 콜백 실행
   */
  onError(callback: (data: { message: string }) => void): void {
    this.addEventListener('error', callback);
  }

  /**
   * 이벤트 리스너 추가 헬퍼
   * @private
   * @param {string} event - 이벤트 이름
   * @param {Function} callback - 콜백 함수
   * @description 이벤트 리스너를 추가하고 관리
   */
  private addEventListener(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    socketService.on(event, callback);
  }

  /**
   * 모든 이벤트 리스너 제거
   * @description 등록된 모든 이벤트 리스너를 제거하고 정리
   */
  removeAllListeners(): void {
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        socketService.off(event, callback);
      });
    });
    this.listeners.clear();
  }

  /**
   * 기본 이벤트 리스너 설정
   * @private
   * @description 연결, 연결 해제, 에러 등 기본 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    // Setup any default event listeners if needed
    socketService.on('connect', () => {
      console.log('Chat service connected');
    });

    socketService.on('disconnect', () => {
      console.log('Chat service disconnected');
    });

    socketService.on('connect_error', (error) => {
      console.error('Chat connection error:', error);
    });
  }
}

/**
 * 채팅 서비스 싱글톤 인스턴스
 * @constant {ChatService}
 * @description 앱 전체에서 사용할 채팅 서비스 인스턴스
 */
export const chatService = new ChatService();