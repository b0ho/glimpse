import ioClient, { Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastHeartbeat: number;
  reconnectAttempts: number;
}

interface OfflineMessage {
  id: string;
  matchId: string;
  message: any;
}

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;
  private connectionState: ConnectionState = {
    isConnected: false,
    isReconnecting: false,
    lastHeartbeat: Date.now(),
    reconnectAttempts: 0
  };
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private offlineMessageQueue: OfflineMessage[] = [];
  private currentUserId: string | null = null;
  private currentAuthToken: string | null = null;

  private constructor() {
    this.setupNetworkListener();
  }

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      if (state.isConnected && this.currentUserId && this.currentAuthToken && !this.socket?.connected) {
        console.log('Network reconnected, attempting to reconnect socket');
        this.reconnect();
      }
    });
  }

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

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

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

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      console.warn('Socket not initialized');
      return;
    }
    this.socket.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (!this.socket) return;
    
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  once(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      console.warn('Socket not initialized');
      return;
    }
    this.socket.once(event, callback);
  }

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

  private startHeartbeat() {
    this.stopHeartbeat();
    
    // Send heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
        
        // Check if we haven't received a pong in 60 seconds
        if (Date.now() - this.connectionState.lastHeartbeat > 60000) {
          console.warn('Heartbeat timeout, reconnecting...');
          this.reconnect();
        }
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

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

  private scheduleReconnect(delay: number = 5000) {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnect();
    }, delay);
  }

  private async handleAuthError() {
    console.log('Handling auth error, token might be expired');
    // Emit an event that the app can listen to for token refresh
    if (this.socket) {
      this.socket.emit('auth_error');
    }
  }

  private queueOfflineMessage(matchId: string, message: any) {
    const offlineMessage: OfflineMessage = {
      id: `offline_${Date.now()}_${Math.random()}`,
      matchId,
      message
    };
    
    this.offlineMessageQueue.push(offlineMessage);
    this.saveOfflineMessagesToStorage();
  }

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

export const socketService = SocketService.getInstance();
export const io = {
  emit: (event: string, data: any) => socketService.emit(event, data),
  on: (event: string, callback: (...args: any[]) => void) => socketService.on(event, callback),
  off: (event: string, callback?: (...args: any[]) => void) => socketService.off(event, callback),
  once: (event: string, callback: (...args: any[]) => void) => socketService.once(event, callback),
  fetchSockets: async () => [] // Mock implementation for compatibility
};