/**
 * 채팅 상태 관리를 위한 Zustand 슬라이스
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, ChatRoom } from '@/types';
import { chatService } from '@/services/chat/chatService';
import { socketService } from '@/services/chat/socketService';

interface TypingUser {
  userId: string;
  nickname: string;
  roomId: string;
  timestamp: number;
}

interface ChatState {
  // 채팅방 목록
  chatRooms: ChatRoom[];
  // 각 채팅방별 메시지 (roomId -> Message[])
  messages: Record<string, Message[]>;
  // 현재 활성 채팅방
  activeRoomId: string | null;
  // 타이핑 중인 사용자들
  typingUsers: TypingUser[];
  // 로딩 상태
  isLoading: boolean;
  // 에러 메시지
  error: string | null;
  // 연결 상태
  connectionState: {
    isConnected: boolean;
    isReconnecting: boolean;
    lastConnectedAt: number | null;
  };
  // 오프라인 메시지 큐
  offlineMessageQueue: Array<{
    roomId: string;
    content: string;
    type: 'TEXT' | 'IMAGE';
    timestamp: number;
  }>;
}

interface ChatActions {
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
  
  // 타이핑 상태
  setTypingStatus: (roomId: string, isTyping: boolean) => void;
  addTypingUser: (userId: string, nickname: string, roomId: string) => void;
  removeTypingUser: (userId: string, roomId: string) => void;
  clearTypingUsers: (roomId: string) => void;
  startTypingCleanup: () => void;
  stopTypingCleanup: () => void;
  
  // 연결 상태
  updateConnectionState: (isConnected: boolean, isReconnecting: boolean) => void;
  handleReconnect: () => void;
  
  // 유틸리티
  clearError: () => void;
  disconnect: () => void;
  reset: () => void;
}

type ChatStore = ChatState & ChatActions;

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

// 타이핑 사용자 정리를 위한 전역 타이머
let typingCleanupInterval: ReturnType<typeof setInterval> | null = null;

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // WebSocket 연결 및 초기화
      initializeChat: async (userId: string, authToken: string) => {
        set({ isLoading: true, error: null });

        try {
          // Socket.IO 연결
          await chatService.connect(userId, authToken);

          // 연결 상태 업데이트
          set({ 
            connectionState: { 
              isConnected: true, 
              isReconnecting: false, 
              lastConnectedAt: Date.now() 
            } 
          });

          // 이벤트 리스너 설정
          chatService.onNewMessage(({ matchId, message }) => {
            get().addMessage(message);

            // 새 메시지 알림 (현재 활성 방이 아닌 경우에만)
            const state = get();
            if (state.activeRoomId !== message.matchId && message.senderId !== userId) {
              // 알림 전송
              import('../../services/notifications/notification-service').then(({ notificationService }) => {
                import('../slices/notificationSlice').then(({ useNotificationStore }) => {
                  const notificationState = useNotificationStore.getState();
                  if (notificationState.settings.newMessages && notificationState.settings.pushEnabled) {
                    const senderName = '익명사용자';
                    const preview = message.type === 'TEXT' 
                      ? message.content 
                      : message.type === 'IMAGE' 
                        ? '📷 사진을 보냈습니다' 
                        : '📎 파일을 보냈습니다';
                    
                    notificationService.notifyNewMessage(message.id, senderName, preview);
                  }
                });
              });
            }
          });

          chatService.onMessagesRead(({ matchId, messageIds, readBy }) => {
            messageIds.forEach(messageId => {
              get().markMessageAsRead(messageId, matchId);
            });
          });

          chatService.onUserTyping(({ userId, isTyping }) => {
            const activeRoom = get().activeRoomId;
            if (activeRoom) {
              if (isTyping) {
                get().addTypingUser(userId, '익명사용자', activeRoom);
              } else {
                get().removeTypingUser(userId, activeRoom);
              }
            }
          });

          chatService.onError(({ message }) => {
            set({ error: message });
          });

          // 연결 상태 이벤트 리스너
          const socket = chatService.isConnected() ? socketService.getSocket() : null;
          if (socket) {
            socket.on('connect', () => {
              console.log('Chat reconnected');
              get().handleReconnect();
            });

            socket.on('disconnect', () => {
              console.log('Chat disconnected');
              get().updateConnectionState(false, false);
            });

            socket.on('reconnecting', () => {
              console.log('Chat reconnecting...');
              get().updateConnectionState(false, true);
            });
          }

          // 채팅방 목록 로드
          await get().loadChatRooms();

          // 타이핑 사용자 정리 시스템 시작
          get().startTypingCleanup();

        } catch (error) {
          console.error('Chat initialization failed:', error);
          set({ error: error instanceof Error ? error.message : '채팅 초기화에 실패했습니다.' });
        } finally {
          set({ isLoading: false });
        }
      },

      // 채팅방 목록 로드
      loadChatRooms: async () => {
        try {
          if (!chatService.isConnected()) {
            throw new Error('Chat service is not connected');
          }

          const rooms = await chatService.getMatches();
          set({ chatRooms: rooms });
        } catch (error) {
          console.error('Failed to load chat rooms:', error);
          set({ error: error instanceof Error ? error.message : '채팅방 목록을 불러오는데 실패했습니다.' });
        }
      },

      // 채팅방 참여
      joinRoom: (roomId: string) => {
        chatService.joinMatch(roomId);
        set({ activeRoomId: roomId });
        
        // 해당 방의 타이핑 사용자 초기화
        get().clearTypingUsers(roomId);
      },

      // 채팅방 나가기
      leaveRoom: (roomId: string) => {
        chatService.leaveMatch(roomId);
        if (get().activeRoomId === roomId) {
          set({ activeRoomId: null });
        }
        
        // 해당 방의 타이핑 사용자 초기화
        get().clearTypingUsers(roomId);
      },

      // 활성 채팅방 설정
      setActiveRoom: (roomId: string | null) => {
        const currentActiveRoom = get().activeRoomId;
        
        // 기존 방에서 나가기
        if (currentActiveRoom) {
          get().leaveRoom(currentActiveRoom);
        }
        
        // 새 방 참여
        if (roomId) {
          get().joinRoom(roomId);
        } else {
          set({ activeRoomId: null });
        }
      },

      // 메시지 히스토리 로드
      loadMessages: async (roomId: string, page = 1) => {
        try {
          const messages = await chatService.getMessages(roomId, page);
          
          set((state) => ({
            messages: {
              ...state.messages,
              [roomId]: page === 1 ? messages : [...(state.messages[roomId] || []), ...messages],
            },
          }));
        } catch (error) {
          console.error('Failed to load messages:', error);
          set({ error: error instanceof Error ? error.message : '메시지를 불러오는데 실패했습니다.' });
        }
      },

      // 메시지 전송
      sendMessage: async (roomId: string, content: string, type: 'TEXT' | 'IMAGE' | 'VOICE' | 'LOCATION' | 'STORY_REPLY' = 'TEXT') => {
        try {
          const state = get();
          
          // 연결 상태 확인
          if (!state.connectionState.isConnected) {
            // 오프라인 상태에서는 메시지를 큐에 저장
            set((state) => ({
              offlineMessageQueue: [
                ...state.offlineMessageQueue,
                {
                  roomId,
                  content,
                  type: type as 'TEXT' | 'IMAGE',
                  timestamp: Date.now(),
                },
              ],
            }));
            
            console.log('Message queued for offline sending');
            return;
          }
          
          // Socket.IO로 메시지 전송 (서버에서 응답 이벤트로 받음)
          await chatService.sendMessage(roomId, content, type as 'TEXT' | 'IMAGE');
          
          
        } catch (error) {
          console.error('Failed to send message:', error);
          set({ error: error instanceof Error ? error.message : '메시지 전송에 실패했습니다.' });
        }
      },

      // 메시지 추가 (실시간 수신)
      addMessage: (message: Message) => {
        set((state) => {
          const roomMessages = state.messages[message.matchId] || [];
          
          // 중복 메시지 체크
          const messageExists = roomMessages.some(m => m.id === message.id);
          if (messageExists) {
            return state;
          }

          return {
            messages: {
              ...state.messages,
              [message.matchId]: [...roomMessages, message].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              ),
            },
          };
        });
      },

      // 메시지 읽음 표시
      markMessageAsRead: (messageId: string, roomId: string) => {
        chatService.markAsRead(roomId, [messageId]);
        
        set((state) => ({
          messages: {
            ...state.messages,
            [roomId]: (state.messages[roomId] || []).map(message =>
              message.id === messageId
                ? { ...message, isRead: true }
                : message
            ),
          },
        }));
      },

      // 타이핑 상태 전송
      setTypingStatus: (roomId: string, isTyping: boolean) => {
        if (isTyping) {
          chatService.startTyping(roomId);
        } else {
          chatService.stopTyping(roomId);
        }
      },

      // 타이핑 사용자 추가 (메모리 누수 방지를 위해 setTimeout 제거)
      addTypingUser: (userId: string, nickname: string, roomId: string) => {
        // 자신은 제외 (현재 사용자 ID는 authStore에서 가져와야 함)
        // TODO: 현재 사용자 ID 확인 필요

        set((state) => {
          const filtered = state.typingUsers.filter(
            user => !(user.userId === userId && user.roomId === roomId)
          );
          
          return {
            typingUsers: [
              ...filtered,
              {
                userId,
                nickname,
                roomId,
                timestamp: Date.now(),
              },
            ],
          };
        });
      },

      // 타이핑 사용자 제거
      removeTypingUser: (userId: string, roomId: string) => {
        set((state) => ({
          typingUsers: state.typingUsers.filter(
            user => !(user.userId === userId && user.roomId === roomId)
          ),
        }));
      },

      // 특정 방의 타이핑 사용자 초기화
      clearTypingUsers: (roomId: string) => {
        set((state) => ({
          typingUsers: state.typingUsers.filter(user => user.roomId !== roomId),
        }));
      },

      // 에러 클리어
      clearError: () => {
        set({ error: null });
      },

      // 연결 해제
      disconnect: () => {
        chatService.disconnect();
        get().stopTypingCleanup();
        set({ activeRoomId: null, typingUsers: [] });
      },

      // 타이핑 사용자 정리 시작 (메모리 누수 방지)
      startTypingCleanup: () => {
        // 기존 타이머가 있으면 정리
        if (typingCleanupInterval) {
          clearInterval(typingCleanupInterval);
        }

        // 5초마다 오래된 타이핑 사용자 정리
        typingCleanupInterval = setInterval(() => {
          const now = Date.now();
          const state = get();
          const validTypingUsers = state.typingUsers.filter(
            user => now - user.timestamp < 5000 // 5초 이내
          );

          if (validTypingUsers.length !== state.typingUsers.length) {
            set({ typingUsers: validTypingUsers });
          }
        }, 5000);
      },

      // 타이핑 사용자 정리 중지
      stopTypingCleanup: () => {
        if (typingCleanupInterval) {
          clearInterval(typingCleanupInterval);
          typingCleanupInterval = null;
        }
      },

      // 오프라인 메시지 처리
      processOfflineMessages: async () => {
        const state = get();
        if (state.connectionState.isConnected && state.offlineMessageQueue.length > 0) {
          console.log(`Processing ${state.offlineMessageQueue.length} offline messages`);
          
          for (const msg of state.offlineMessageQueue) {
            try {
              await chatService.sendMessage(msg.roomId, msg.content, msg.type);
            } catch (error) {
              console.error('Failed to send offline message:', error);
            }
          }
          
          // 큐 비우기
          set({ offlineMessageQueue: [] });
        }
      },

      // 연결 상태 업데이트
      updateConnectionState: (isConnected: boolean, isReconnecting: boolean) => {
        set((state) => ({
          connectionState: {
            isConnected,
            isReconnecting,
            lastConnectedAt: isConnected ? Date.now() : state.connectionState.lastConnectedAt,
          },
        }));
      },

      // 재연결 처리
      handleReconnect: () => {
        get().updateConnectionState(true, false);
        get().processOfflineMessages();
        get().loadChatRooms();
      },

      // 상태 초기화
      reset: () => {
        get().disconnect();
        set(initialState);
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // 민감한 데이터는 저장하지 않음
      partialize: (state) => ({
        chatRooms: state.chatRooms,
        // messages는 보안상 메모리에만 저장
      }),
    }
  )
);

// 선택자 함수들
export const chatSelectors = {
  // 특정 방의 메시지 가져오기
  getMessages: (roomId: string) => (state: ChatStore) => state.messages[roomId] || [],
  
  // 특정 방의 읽지 않은 메시지 수
  getUnreadCount: (roomId: string) => (state: ChatStore) => {
    const messages = state.messages[roomId] || [];
    // TODO: 현재 사용자 ID를 authStore에서 가져와야 함
    return messages.filter(msg => !msg.isRead).length;
  },
  
  // 특정 방의 타이핑 사용자들
  getTypingUsers: (roomId: string) => (state: ChatStore) =>
    state.typingUsers.filter(user => user.roomId === roomId),
  
  // 총 읽지 않은 메시지 수
  getTotalUnreadCount: () => (state: ChatStore) => {
    return state.chatRooms.reduce((total, room) => {
      return total + chatSelectors.getUnreadCount(room.id)(state);
    }, 0);
  },
};