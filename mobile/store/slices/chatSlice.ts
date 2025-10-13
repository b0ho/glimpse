/**
 * 채팅 상태 관리 슬라이스 - 모듈화된 버전
 */

import { create, persist, createJSONStorage } from '../zustandCompat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { chatService } from '@/services/chat/chatService';
import { socketService } from '@/services/chat/socketService';
import { Message } from '@/types';
import { 
  ChatStore, 
  ChatState, 
  TypingUser, 
  ConnectionState,
  OfflineMessage 
} from '../types/chatTypes';
import {
  isDuplicateMessage,
  sortMessagesByTime,
  cleanupTypingUsers,
  mergeMessages,
} from '../utils/chatHelpers';

/**
 * 초기 상태
 */
const initialState: ChatState = {
  chatRooms: [],
  messages: {},
  activeRoomId: null,
  typingUsers: [],
  isLoading: false,
  error: null,
  connectionState: {
    isConnected: false,
    isReconnecting: false,
    lastConnectedAt: null,
  },
  offlineMessageQueue: [],
};

/**
 * 채팅 스토어
 */
export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      /**
       * WebSocket 연결 및 채팅 초기화
       */
      initializeChat: async (userId: string, authToken: string) => {
        try {
          set({ isLoading: true, error: null });

          // WebSocket 연결
          await socketService.connect(userId, authToken);
          
          // 연결 상태 업데이트
          set({
            connectionState: {
              isConnected: true,
              isReconnecting: false,
              lastConnectedAt: Date.now(),
            },
          });
          
          // 소켓 이벤트 리스너 설정
          socketService.on('message', (message: Message) => {
            get().addMessage(message);
          });
          
          socketService.on('typing', (data: TypingUser) => {
            get().addTypingUser(data);
          });
          
          socketService.on('disconnect', () => {
            get().setConnectionState({ isConnected: false });
          });
          
          socketService.on('reconnect', () => {
            get().setConnectionState({ 
              isConnected: true, 
              isReconnecting: false 
            });
            get().processOfflineMessages();
          });
          
          // 채팅방 목록 로드
          await get().loadChatRooms();
          
          set({ isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || '채팅 초기화 실패',
            isLoading: false 
          });
        }
      },
      
      /**
       * 채팅방 목록 로드
       */
      loadChatRooms: async () => {
        try {
          const rooms = await chatService.getMatches();
          set({ chatRooms: rooms });
        } catch (error: any) {
          set({ error: error.message || '채팅방 목록 로드 실패' });
        }
      },
      
      /**
       * 채팅방 참여
       */
      joinRoom: (roomId: string) => {
        socketService.emit('join_room', { roomId });
      },
      
      /**
       * 채팅방 나가기
       */
      leaveRoom: (roomId: string) => {
        socketService.emit('leave_room', { roomId });
      },
      
      /**
       * 활성 채팅방 설정
       */
      setActiveRoom: (roomId: string | null) => {
        set({ activeRoomId: roomId });
      },
      
      /**
       * 메시지 기록 로드
       */
      loadMessages: async (roomId: string, page: number = 1) => {
        try {
          const newMessages = await chatService.getMessages(roomId, page);
          const currentMessages = get().messages[roomId] || [];
          const mergedMessages = mergeMessages(currentMessages, newMessages);
          
          set(state => ({
            messages: {
              ...state.messages,
              [roomId]: mergedMessages,
            },
          }));
        } catch (error: any) {
          set({ error: error.message || '메시지 로드 실패' });
        }
      },
      
      /**
       * 메시지 전송
       */
      sendMessage: async (roomId: string, content: string, type = 'TEXT' as any) => {
        const { connectionState } = get();
        
        // 오프라인인 경우 큐에 추가
        if (!connectionState.isConnected) {
          get().addToOfflineQueue({
            roomId,
            content,
            type,
            timestamp: Date.now(),
          });
          return;
        }
        
        try {
          await chatService.sendMessage(roomId, content, type);
        } catch (error: any) {
          // 전송 실패시 오프라인 큐에 추가
          get().addToOfflineQueue({
            roomId,
            content,
            type,
            timestamp: Date.now(),
          });
          throw error;
        }
      },
      
      /**
       * 메시지 추가 (실시간 수신)
       */
      addMessage: (message: Message) => {
        const { messages } = get();
        const roomMessages = messages[message.roomId] || [];
        
        // 중복 체크
        if (isDuplicateMessage(roomMessages, message)) {
          return;
        }
        
        const updatedMessages = sortMessagesByTime([...roomMessages, message]);
        
        set(state => ({
          messages: {
            ...state.messages,
            [message.roomId]: updatedMessages,
          },
        }));
      },
      
      /**
       * 메시지 읽음 표시
       */
      markMessageAsRead: (messageId: string, roomId: string) => {
        set(state => ({
          messages: {
            ...state.messages,
            [roomId]: (state.messages[roomId] || []).map(msg =>
              msg.id === messageId ? { ...msg, isRead: true } : msg
            ),
          },
        }));
        
        // 서버에 읽음 상태 전송
        socketService.emit('read_message', { messageId, roomId });
      },
      
      /**
       * 오프라인 메시지 처리
       */
      processOfflineMessages: () => {
        const { offlineMessageQueue } = get();
        
        offlineMessageQueue.forEach(async msg => {
          try {
            await chatService.sendMessage(msg.roomId, msg.content, msg.type);
          } catch (error) {
            console.error('Failed to send offline message:', error);
          }
        });
        
        get().clearOfflineQueue();
      },
      
      /**
       * 타이핑 상태 설정
       */
      setTypingStatus: (roomId: string, isTyping: boolean) => {
        socketService.emit('typing', { roomId, isTyping });
      },
      
      /**
       * 타이핑 사용자 추가
       */
      addTypingUser: (user: TypingUser) => {
        set(state => ({
          typingUsers: [
            ...state.typingUsers.filter(u => 
              !(u.userId === user.userId && u.roomId === user.roomId)
            ),
            user,
          ],
        }));
        
        // 3초 후 자동 제거
        setTimeout(() => {
          get().removeTypingUser(user.userId, user.roomId);
        }, 3000);
      },
      
      /**
       * 타이핑 사용자 제거
       */
      removeTypingUser: (userId: string, roomId: string) => {
        set(state => ({
          typingUsers: state.typingUsers.filter(u => 
            !(u.userId === userId && u.roomId === roomId)
          ),
        }));
      },
      
      /**
       * 연결 상태 설정
       */
      setConnectionState: (state: Partial<ConnectionState>) => {
        set(prevState => ({
          connectionState: {
            ...prevState.connectionState,
            ...state,
          },
        }));
      },
      
      /**
       * 오프라인 큐에 추가
       */
      addToOfflineQueue: (message: OfflineMessage) => {
        set(state => ({
          offlineMessageQueue: [...state.offlineMessageQueue, message],
        }));
      },
      
      /**
       * 오프라인 큐 비우기
       */
      clearOfflineQueue: () => {
        set({ offlineMessageQueue: [] });
      },
      
      /**
       * 정리
       */
      cleanup: () => {
        socketService.disconnect();
        set(initialState);
      },
      
      /**
       * 상태 초기화
       */
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        offlineMessageQueue: state.offlineMessageQueue,
        messages: state.messages,
      }),
    }
  )
);