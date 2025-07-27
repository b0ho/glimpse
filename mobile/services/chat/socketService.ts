import ioClient, { Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/config';

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect(userId: string, authToken: string): Promise<void> {
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
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket!.on('connect', () => {
        console.log('Socket connected');
        resolve();
      });

      this.socket!.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  emit(event: string, data: any) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot emit event:', event);
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
}

export const socketService = SocketService.getInstance();
export const io = {
  emit: (event: string, data: any) => socketService.emit(event, data),
  on: (event: string, callback: (...args: any[]) => void) => socketService.on(event, callback),
  off: (event: string, callback?: (...args: any[]) => void) => socketService.off(event, callback),
  once: (event: string, callback: (...args: any[]) => void) => socketService.once(event, callback),
  fetchSockets: async () => [] // Mock implementation for compatibility
};