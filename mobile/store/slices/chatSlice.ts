/**
 * 채팅 상태 관리를 위한 Zustand 슬라이스
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, ChatRoom } from '@/types';
import { webSocketService } from '@/services/chat/websocket-service';

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
  sendMessage: (roomId: string, content: string, type?: 'text' | 'image' | 'file') => Promise<void>;
  addMessage: (message: Message) => void;
  markMessageAsRead: (messageId: string, roomId: string) => void;
  
  // 타이핑 상태
  setTypingStatus: (roomId: string, isTyping: boolean) => void;
  addTypingUser: (userId: string, nickname: string, roomId: string) => void;
  removeTypingUser: (userId: string, roomId: string) => void;
  clearTypingUsers: (roomId: string) => void;
  startTypingCleanup: () => void;
  stopTypingCleanup: () => void;
  
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
          // WebSocket 연결
          await webSocketService.connect(userId, authToken);

          // 이벤트 리스너 설정
          webSocketService.on('message', (message: Message) => {
            get().addMessage(message);

            // 새 메시지 알림 (현재 활성 방이 아닌 경우에만)
            const state = get();
            if (state.activeRoomId !== message.roomId && message.senderId !== userId) {
              // 알림 전송
              import('../../services/notifications/notification-service').then(({ notificationService }) => {
                import('../slices/notificationSlice').then(({ useNotificationStore }) => {
                  const notificationState = useNotificationStore.getState();
                  if (notificationState.settings.newMessages && notificationState.settings.pushEnabled) {
                    const senderName = message.senderNickname || '익명사용자';
                    const preview = message.type === 'text' 
                      ? message.content 
                      : message.type === 'image' 
                        ? '📷 사진을 보냈습니다' 
                        : '📎 파일을 보냈습니다';
                    
                    notificationService.notifyNewMessage(message.id, senderName, preview);
                  }
                });
              });
            }
          });

          webSocketService.on('messageRead', ({ messageId, readBy: _readBy }) => {
            get().markMessageAsRead(messageId, get().activeRoomId || '');
          });

          webSocketService.on('typing', ({ roomId, userId, isTyping }) => {
            if (isTyping) {
              get().addTypingUser(userId, '익명사용자', roomId); // 실제로는 닉네임 조회 필요
            } else {
              get().removeTypingUser(userId, roomId);
            }
          });

          webSocketService.on('error', (error: string) => {
            set({ error });
          });

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
          if (!webSocketService.connected) {
            throw new Error('WebSocket is not connected');
          }

          const rooms = await webSocketService.getChatRooms();
          set({ chatRooms: rooms });
        } catch (error) {
          console.error('Failed to load chat rooms:', error);
          set({ error: error instanceof Error ? error.message : '채팅방 목록을 불러오는데 실패했습니다.' });
        }
      },

      // 채팅방 참여
      joinRoom: (roomId: string) => {
        webSocketService.joinRoom(roomId);
        set({ activeRoomId: roomId });
        
        // 해당 방의 타이핑 사용자 초기화
        get().clearTypingUsers(roomId);
      },

      // 채팅방 나가기
      leaveRoom: (roomId: string) => {
        webSocketService.leaveRoom(roomId);
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
          const messages = await webSocketService.getMessageHistory(roomId, page);
          
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
      sendMessage: async (roomId: string, content: string, type = 'text') => {
        try {
          const message = await webSocketService.sendMessage(roomId, content, type);
          
          // 로컬 상태에 즉시 반영 (optimistic update)
          get().addMessage(message);
          
          // 채팅방 목록의 lastMessage 업데이트
          set((state) => ({
            chatRooms: state.chatRooms.map(room =>
              room.id === roomId
                ? { ...room, lastMessage: message, updatedAt: new Date() }
                : room
            ),
          }));
          
          // 상대방에게 새 메시지 알림 전송
          if (typeof window !== 'undefined') {
            // 알림 설정 확인 후 전송
            import('../slices/notificationSlice').then(({ useNotificationStore }) => {
              const notificationState = useNotificationStore.getState();
              if (notificationState.settings.pushEnabled && notificationState.settings.newMessages) {
                // 상대방 닉네임 가져오기 (메시지에서 또는 기본값 사용)
                const otherUserNickname = message.senderNickname || '익명 사용자';
                
                // 메시지 미리보기 (최대 50자)
                const preview = content.length > 50 ? content.substring(0, 47) + '...' : content;
                
                import('../../services/notifications/notification-service').then(({ notificationService }) => {
                  // 상대방에게 알림 전송 (메시지 전송자는 자신이므로 알림 받지 않음)
                  notificationService.notifyNewMessage(message.id, otherUserNickname, preview);
                });
              }
            });
          }
          
        } catch (error) {
          console.error('Failed to send message:', error);
          set({ error: error instanceof Error ? error.message : '메시지 전송에 실패했습니다.' });
        }
      },

      // 메시지 추가 (실시간 수신)
      addMessage: (message: Message) => {
        set((state) => {
          const roomMessages = state.messages[message.roomId] || [];
          
          // 중복 메시지 체크
          const messageExists = roomMessages.some(m => m.id === message.id);
          if (messageExists) {
            return state;
          }

          return {
            messages: {
              ...state.messages,
              [message.roomId]: [...roomMessages, message].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              ),
            },
          };
        });
      },

      // 메시지 읽음 표시
      markMessageAsRead: (messageId: string, roomId: string) => {
        webSocketService.markMessageAsRead(messageId, roomId);
        
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
        webSocketService.sendTypingStatus(roomId, isTyping);
      },

      // 타이핑 사용자 추가 (메모리 누수 방지를 위해 setTimeout 제거)
      addTypingUser: (userId: string, nickname: string, roomId: string) => {
        // 자신은 제외
        if (userId === webSocketService.userId) {
          return;
        }

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
        webSocketService.disconnect();
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
    return messages.filter(msg => !msg.isRead && msg.senderId !== webSocketService.userId).length;
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