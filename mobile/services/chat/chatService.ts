import { socketService } from './socketService';
import apiClient from '../api/config';
import { Message, ChatRoom } from '@/types';
import { EncryptionService } from '../encryptionService';

const encryptionService = new EncryptionService();

interface ChatServiceInterface {
  // Connection
  connect(userId: string, authToken: string): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;

  // Room management
  joinMatch(matchId: string): void;
  leaveMatch(matchId: string): void;

  // Messaging
  sendMessage(matchId: string, content: string, type?: 'TEXT' | 'IMAGE'): void;
  markAsRead(matchId: string, messageIds: string[]): void;

  // Typing indicators
  startTyping(matchId: string): void;
  stopTyping(matchId: string): void;

  // Online status
  getOnlineStatus(userIds: string[]): void;

  // API calls
  getMatches(): Promise<ChatRoom[]>;
  getMessages(matchId: string, page?: number, limit?: number): Promise<Message[]>;
  uploadImage(matchId: string, imageUri: string): Promise<string>;

  // Event listeners
  onNewMessage(callback: (data: { matchId: string; message: Message }) => void): void;
  onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void): void;
  onMessagesRead(callback: (data: { matchId: string; messageIds: string[]; readBy: string }) => void): void;
  onUserJoined(callback: (data: { userId: string }) => void): void;
  onUserLeft(callback: (data: { userId: string }) => void): void;
  onUserOffline(callback: (data: { userId: string }) => void): void;
  onOnlineStatus(callback: (data: Array<{ userId: string; isOnline: boolean }>) => void): void;
  onError(callback: (data: { message: string }) => void): void;

  // Cleanup
  removeAllListeners(): void;
}

class ChatService implements ChatServiceInterface {
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  async connect(userId: string, authToken: string): Promise<void> {
    await socketService.connect(userId, authToken);
    this.setupEventListeners();
  }

  disconnect(): void {
    this.removeAllListeners();
    socketService.disconnect();
  }

  isConnected(): boolean {
    return socketService.getSocket()?.connected || false;
  }

  // Room management
  joinMatch(matchId: string): void {
    socketService.emit('join-match', matchId);
  }

  leaveMatch(matchId: string): void {
    socketService.emit('leave-match', matchId);
  }

  // Messaging
  async sendMessage(matchId: string, content: string, type: 'TEXT' | 'IMAGE' = 'TEXT'): Promise<void> {
    // Encrypt message content
    const encryptedContent = await encryptionService.encryptMessage(content);
    
    socketService.emit('send-message', {
      matchId,
      content: encryptedContent,
      type
    });
  }

  markAsRead(matchId: string, messageIds: string[]): void {
    socketService.emit('mark-as-read', {
      matchId,
      messageIds
    });
  }

  // Typing indicators
  startTyping(matchId: string): void {
    socketService.emit('typing-start', matchId);
  }

  stopTyping(matchId: string): void {
    socketService.emit('typing-stop', matchId);
  }

  // Online status
  getOnlineStatus(userIds: string[]): void {
    socketService.emit('get-online-status', userIds);
  }

  // API calls
  async getMatches(): Promise<ChatRoom[]> {
    try {
      const response = await apiClient.get('/matches');
      return response.data.data;
    } catch (error) {
      console.error('Failed to get matches:', error);
      throw error;
    }
  }

  async getMessages(matchId: string, page = 1, limit = 20): Promise<Message[]> {
    try {
      const response = await apiClient.get(`/matches/${matchId}/messages`, {
        params: { page, limit }
      });
      
      // Decrypt messages
      const messages = response.data.data;
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

  async uploadImage(matchId: string, imageUri: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);
      formData.append('matchId', matchId);

      const response = await apiClient.post('/upload/chat-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data.url;
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw error;
    }
  }

  // Event listeners
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

  onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void): void {
    this.addEventListener('user-typing', callback);
  }

  onMessagesRead(callback: (data: { matchId: string; messageIds: string[]; readBy: string }) => void): void {
    this.addEventListener('messages-read', callback);
  }

  onUserJoined(callback: (data: { userId: string }) => void): void {
    this.addEventListener('user-joined', callback);
  }

  onUserLeft(callback: (data: { userId: string }) => void): void {
    this.addEventListener('user-left', callback);
  }

  onUserOffline(callback: (data: { userId: string }) => void): void {
    this.addEventListener('user-offline', callback);
  }

  onOnlineStatus(callback: (data: Array<{ userId: string; isOnline: boolean }>) => void): void {
    this.addEventListener('online-status', callback);
  }

  onError(callback: (data: { message: string }) => void): void {
    this.addEventListener('error', callback);
  }

  // Helper methods
  private addEventListener(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    socketService.on(event, callback);
  }

  removeAllListeners(): void {
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        socketService.off(event, callback);
      });
    });
    this.listeners.clear();
  }

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

export const chatService = new ChatService();