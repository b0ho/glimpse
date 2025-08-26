import ioClient, { Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

/**
 * 연결 상태 인터페이스
 * @interface ConnectionState
 * @property {boolean} isConnected - 연결 여부
 * @property {boolean} isReconnecting - 재연결 중 여부
 * @property {number} lastHeartbeat - 마지막 하트비트 시간
 * @property {number} reconnectAttempts - 재연결 시도 횟수
 */
interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastHeartbeat: number;
  reconnectAttempts: number;
}

/**
 * 오프라인 메시지 인터페이스
 * @interface OfflineMessage
 * @property {string} id - 메시지 ID
 * @property {string} matchId - 매칭 ID
 * @property {any} message - 메시지 내용
 */
interface OfflineMessage {
  id: string;
  matchId: string;
  message: any;
}

/**
 * Socket.IO 서비스 클래스
 * @class SocketService
 * @description WebSocket 연결 관리, 재연결, 오프라인 메시지 큐 관리
 */
class SocketService {
  /** Socket.IO 클라이언트 인스턴스 */
  private socket: Socket | null = null;
  /** 싱글톤 인스턴스 */
  private static instance: SocketService;
  /** 연결 상태 */
  private connectionState: ConnectionState = {
    isConnected: false,
    isReconnecting: false,
    lastHeartbeat: Date.now(),
    reconnectAttempts: 0
  };
  /** 하트비트 인터벌 */
  private heartbeatInterval: NodeJS.Timeout | null = null;
  /** 재연결 타임아웃 */
  private reconnectTimeout: NodeJS.Timeout | null = null;
  /** 오프라인 메시지 큐 */
  private offlineMessageQueue: OfflineMessage[] = [];
  /** 현재 사용자 ID */
  private currentUserId: string | null = null;
  /** 현재 인증 토큰 */
  private currentAuthToken: string | null = null;

  /**
   * SocketService 생성자
   * @private
   * @constructor
   * @description 네트워크 리스너 설정
   */
  private constructor() {
    this.setupNetworkListener();
  }

  /**
   * 싱글톤 인스턴스 가져오기
   * @static
   * @returns {SocketService} SocketService 인스턴스
   * @description 앱 전체에서 하나의 Socket 연결만 사용
   */
  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * 네트워크 상태 리스너 설정
   * @private
   * @description 네트워크 연결이 복구되면 Socket 재연결 시도
   */
  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      if (state.isConnected && this.currentUserId && this.currentAuthToken && !this.socket?.connected) {
        console.log('Network reconnected, attempting to reconnect socket');
        this.reconnect();
      }
    });
  }

  /**
   * Socket.IO 서버 연결
   * @async
   * @param {string} userId - 사용자 ID
   * @param {string} authToken - 인증 토큰
   * @returns {Promise<void>}
   * @description Socket.IO 서버에 연결하고 이벤트 핸들러 설정
   */
  connect(userId: string, authToken: string): Promise<void> {
    this.currentUserId = userId;
    this.currentAuthToken = authToken;

    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      const socketUrl = API_BASE_URL.replace('/api/v1', '');
      
      this.socket = ioClient(socketUrl, {
        auth: {
          token: authToken,
          userId
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
      });

      this.setupEventHandlers();

      this.socket!.on('connect', () => {
        console.log('Socket connected');
        this.connectionState.isConnected = true;
        this.connectionState.isReconnecting = false;
        this.connectionState.reconnectAttempts = 0;
        this.startHeartbeat();
        this.processOfflineMessageQueue();
        resolve();
      });

      this.socket!.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        if (this.connectionState.reconnectAttempts === 0) {
          reject(error);
        }
      });
    });
  }

  /**
   * Socket.IO 연결 해제
   * @description 하트비트 중지, 재연결 타이머 취소, 소켓 연결 해제
   */
  disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionState.isConnected = false;
    this.currentUserId = null;
    this.currentAuthToken = null;
  }

  /**
   * Socket 인스턴스 가져오기
   * @returns {Socket | null} Socket.IO 클라이언트 인스턴스
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * 연결 상태 확인
   * @returns {boolean} Socket 연결 여부
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Socket 이벤트 전송
   * @param {string} event - 이벤트 이름
   * @param {any} data - 전송할 데이터
   * @description 연결되지 않은 경우 메시지를 오프라인 큐에 저장
   */
  emit(event: string, data: any) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, queueing event:', event);
      // Queue message for sending when reconnected
      if (event === 'send-message' && data.matchId) {
        this.queueOfflineMessage(data.matchId, data);
      }
      return;
    }
    this.socket.emit(event, data);
  }

  /**
   * Socket 이벤트 리스너 등록
   * @param {string} event - 이벤트 이름
   * @param {Function} callback - 콜백 함수
   * @description 특정 이벤트에 대한 리스너 등록
   */
  on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      console.warn('Socket not initialized');
      return;
    }
    this.socket.on(event, callback);
  }

  /**
   * Socket 이벤트 리스너 제거
   * @param {string} event - 이벤트 이름
   * @param {Function} [callback] - 제거할 특정 콜백 함수
   * @description 이벤트 리스너 제거 (콜백 미지정 시 모든 리스너 제거)
   */
  off(event: string, callback?: (...args: any[]) => void) {
    if (!this.socket) return;
    
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  /**
   * Socket 일회성 이벤트 리스너
   * @param {string} event - 이벤트 이름
   * @param {Function} callback - 콜백 함수
   * @description 한 번만 실행되는 이벤트 리스너 등록
   */
  once(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      console.warn('Socket not initialized');
      return;
    }
    this.socket.once(event, callback);
  }

  /**
   * Socket 이벤트 핸들러 설정
   * @private
   * @description 연결, 재연결, 오프라인 메시지 등 주요 이벤트 핸들러 설정
   */
  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connectionState.isConnected = false;
      this.stopHeartbeat();
      
      // Attempt to reconnect if it wasn't a manual disconnect
      if (reason !== 'io client disconnect') {
        this.scheduleReconnect();
      }
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
      this.connectionState.reconnectAttempts = attemptNumber;
    });

    this.socket.on('reconnect', () => {
      console.log('Socket reconnected successfully');
      this.connectionState.isConnected = true;
      this.connectionState.isReconnecting = false;
      this.connectionState.reconnectAttempts = 0;
      this.startHeartbeat();
      this.processOfflineMessageQueue();
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
      this.connectionState.isReconnecting = false;
      // Try manual reconnect after a delay
      this.scheduleReconnect(30000); // 30 seconds
    });

    // Handle heartbeat response
    this.socket.on('pong', () => {
      this.connectionState.lastHeartbeat = Date.now();
    });

    // Handle offline messages from server
    this.socket.on('offline-messages', async (data: { messages: any[], hasMore: boolean }) => {
      console.log(`Received ${data.messages.length} offline messages`);
      // Process offline messages
      for (const msg of data.messages) {
        if (msg.type === 'offline_message' && msg.payload) {
          // Emit the message as if it was received normally
          this.socket?.emit('new-message', msg.payload);
        }
      }
    });

    // Handle errors
    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
      if (error.code === 'UNAUTHORIZED' || error.message?.includes('权限')) {
        // Token might be expired, need to refresh
        this.handleAuthError();
      }
    });
  }

  /**
   * 하트비트 시작
   * @private
   * @description 30초마다 ping을 보내고 60초 이내 pong이 없으면 재연결
   */
  private startHeartbeat() {
    this.stopHeartbeat();
    
    // Send heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('common:ping');
        
        // Check if we haven't received a pong in 60 seconds
        if (Date.now() - this.connectionState.lastHeartbeat > 60000) {
          console.warn('Heartbeat timeout, reconnecting...');
          this.reconnect();
        }
      }
    }, 30000);
  }

  /**
   * 하트비트 중지
   * @private
   * @description 하트비트 인터벌 타이머 정리
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Socket 재연결
   * @private
   * @async
   * @description 기존 연결을 종료하고 새로운 연결 시도
   */
  private async reconnect() {
    if (this.connectionState.isReconnecting || !this.currentUserId || !this.currentAuthToken) {
      return;
    }

    this.connectionState.isReconnecting = true;
    console.log('Attempting to reconnect socket...');

    try {
      // Disconnect existing socket
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
      }

      // Create new connection
      await this.connect(this.currentUserId, this.currentAuthToken);
      console.log('Socket reconnected successfully');
    } catch (error) {
      console.error('Socket reconnection failed:', error);
      this.connectionState.isReconnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * 재연결 스케줄링
   * @private
   * @param {number} [delay=5000] - 재연결 지연 시간 (ms)
   * @description 지정된 시간 후 재연결 시도
   */
  private scheduleReconnect(delay: number = 5000) {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnect();
    }, delay);
  }

  /**
   * 인증 오류 처리
   * @private
   * @async
   * @description 토큰 만료 등 인증 오류 발생 시 처리
   */
  private async handleAuthError() {
    console.log('Handling auth error, token might be expired');
    // Emit an event that the app can listen to for token refresh
    if (this.socket) {
      this.socket.emit('auth_error');
    }
  }

  /**
   * 오프라인 메시지 큐에 추가
   * @private
   * @param {string} matchId - 매칭 ID
   * @param {any} message - 메시지 내용
   * @description 연결되지 않은 상태에서 전송할 메시지를 큐에 저장
   */
  private queueOfflineMessage(matchId: string, message: any) {
    const offlineMessage: OfflineMessage = {
      id: `offline_${Date.now()}_${Math.random()}`,
      matchId,
      message
    };
    
    this.offlineMessageQueue.push(offlineMessage);
    this.saveOfflineMessagesToStorage();
  }

  /**
   * 오프라인 메시지를 스토리지에 저장
   * @private
   * @async
   * @description AsyncStorage에 오프라인 메시지 큐 저장
   */
  private async saveOfflineMessagesToStorage() {
    try {
      await AsyncStorage.setItem(
        '@offline_messages',
        JSON.stringify(this.offlineMessageQueue)
      );
    } catch (error) {
      console.error('Failed to save offline messages:', error);
    }
  }

  /**
   * 스토리지에서 오프라인 메시지 로드
   * @private
   * @async
   * @description AsyncStorage에서 오프라인 메시지 큐 복원
   */
  private async loadOfflineMessagesFromStorage() {
    try {
      const messages = await AsyncStorage.getItem('@offline_messages');
      if (messages) {
        this.offlineMessageQueue = JSON.parse(messages);
      }
    } catch (error) {
      console.error('Failed to load offline messages:', error);
    }
  }

  /**
   * 오프라인 메시지 큐 처리
   * @private
   * @async
   * @description 연결 복구 시 대기 중이던 메시지를 전송
   */
  private async processOfflineMessageQueue() {
    if (this.offlineMessageQueue.length === 0) {
      await this.loadOfflineMessagesFromStorage();
    }

    if (this.offlineMessageQueue.length > 0 && this.socket?.connected) {
      console.log(`Processing ${this.offlineMessageQueue.length} offline messages`);
      
      for (const msg of this.offlineMessageQueue) {
        this.socket.emit('send-message', msg.message);
      }
      
      // Clear the queue
      this.offlineMessageQueue = [];
      await AsyncStorage.removeItem('@offline_messages');
    }
  }
}

/**
 * Socket 서비스 싱글톤 인스턴스
 * @constant {SocketService}
 */
export const socketService = SocketService.getInstance();

/**
 * Socket.IO 호환 API
 * @constant {Object}
 * @description Socket.IO 클라이언트와 동일한 인터페이스 제공
 */
export const io = {
  emit: (event: string, data: any) => socketService.emit(event, data),
  on: (event: string, callback: (...args: any[]) => void) => socketService.on(event, callback),
  off: (event: string, callback?: (...args: any[]) => void) => socketService.off(event, callback),
  once: (event: string, callback: (...args: any[]) => void) => socketService.once(event, callback),
  fetchSockets: async () => [] // Mock implementation for compatibility
};