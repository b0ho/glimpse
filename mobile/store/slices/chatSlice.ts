/**
 * 채팅 상태 관리를 위한 Zustand 슬라이스
 * @module chatSlice
 * @description WebSocket 기반 실시간 채팅, 타이핑 상태, 오프라인 메시지 큐 관리
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, ChatRoom } from '@/types';
import { chatService } from '@/services/chat/chatService';
import { socketService } from '@/services/chat/socketService';

/**
 * 타이핑 중인 사용자 정보
 * @interface TypingUser
 * @description 현재 메시지를 작성 중인 사용자 정보
 */
interface TypingUser {
  /** 사용자 ID */
  userId: string;
  /** 사용자 닉네임 */
  nickname: string;
  /** 채팅방 ID */
  roomId: string;
  /** 타이핑 시작 시간 */
  timestamp: number;
}

/**
 * 채팅 상태 인터페이스
 * @interface ChatState
 * @description 채팅 관련 모든 상태 정보
 */
interface ChatState {
  /** 채팅방 목록 */
  chatRooms: ChatRoom[];
  /** 각 채팅방별 메시지 (roomId -> Message[]) */
  messages: Record<string, Message[]>;
  /** 현재 활성 채팅방 */
  activeRoomId: string | null;
  /** 타이핑 중인 사용자들 */
  typingUsers: TypingUser[];
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 연결 상태 */
  connectionState: {
    /** WebSocket 연결 여부 */
    isConnected: boolean;
    /** 재연결 중 여부 */
    isReconnecting: boolean;
    /** 마지막 연결 시간 */
    lastConnectedAt: number | null;
  };
  /** 오프라인 메시지 큐 */
  offlineMessageQueue: Array<{
    /** 채팅방 ID */
    roomId: string;
    /** 메시지 내용 */
    content: string;
    /** 메시지 타입 */
    type: 'TEXT' | 'IMAGE';
    /** 시간 */
    timestamp: number;
  }>;
}

/**
 * 채팅 액션 인터페이스
 * @interface ChatActions
 * @description 채팅 관련 모든 액션 메서드
 */
interface ChatActions {
  // WebSocket 연결 및 초기화
  /** WebSocket 연결 및 채팅 초기화 */
  initializeChat: (userId: string, authToken: string) => Promise<void>;
  
  // 채팅방 관련
  /** 채팅방 목록 로드 */
  loadChatRooms: () => Promise<void>;
  /** 채팅방 참여 */
  joinRoom: (roomId: string) => void;
  /** 채팅방 나가기 */
  leaveRoom: (roomId: string) => void;
  /** 활성 채팅방 설정 */
  setActiveRoom: (roomId: string | null) => void;
  
  // 메시지 관련
  /** 메시지 기록 로드 */
  loadMessages: (roomId: string, page?: number) => Promise<void>;
  /** 메시지 전송 */
  sendMessage: (roomId: string, content: string, type?: 'TEXT' | 'IMAGE' | 'VOICE' | 'LOCATION' | 'STORY_REPLY') => Promise<void>;
  /** 메시지 추가 (실시간 수신) */
  addMessage: (message: Message) => void;
  /** 메시지 읽음 표시 */
  markMessageAsRead: (messageId: string, roomId: string) => void;
  /** 오프라인 메시지 처리 */
  processOfflineMessages: () => void;
  
  // 타이핑 상태
  /** 타이핑 상태 전송 */
  setTypingStatus: (roomId: string, isTyping: boolean) => void;
  /** 타이핑 사용자 추가 */
  addTypingUser: (userId: string, nickname: string, roomId: string) => void;
  /** 타이핑 사용자 제거 */
  removeTypingUser: (userId: string, roomId: string) => void;
  /** 특정 방의 타이핑 사용자 초기화 */
  clearTypingUsers: (roomId: string) => void;
  /** 타이핑 사용자 정리 시작 */
  startTypingCleanup: () => void;
  /** 타이핑 사용자 정리 중지 */
  stopTypingCleanup: () => void;
  
  // 연결 상태
  /** 연결 상태 업데이트 */
  updateConnectionState: (isConnected: boolean, isReconnecting: boolean) => void;
  /** 재연결 처리 */
  handleReconnect: () => void;
  
  // 유틸리티
  /** 에러 초기화 */
  clearError: () => void;
  /** 연결 해제 */
  disconnect: () => void;
  /** 상태 초기화 */
  reset: () => void;
}

/**
 * 채팅 스토어 타입
 * @type ChatStore
 * @description 채팅 상태와 액션을 포함한 전체 스토어 타입
 */
type ChatStore = ChatState & ChatActions;

/**
 * 채팅 상태 초기값
 * @constant initialState
 * @description 채팅 스토어의 초기 상태
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
 * 타이핑 사용자 정리를 위한 전역 타이머
 * @type {ReturnType<typeof setInterval> | null}
 * @description 5초마다 오래된 타이핑 상태를 정리
 */
let typingCleanupInterval: ReturnType<typeof setInterval> | null = null;

/**
 * 채팅 상태 관리 스토어
 * @constant useChatStore
 * @description WebSocket 기반 실시간 채팅, 오프라인 큐, 타이핑 상태를 관리하는 Zustand 스토어
 * @example
 * ```typescript
 * const { initializeChat, sendMessage, messages } = useChatStore();
 * ```
 */
export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * WebSocket 연결 및 채팅 초기화
       * @async
       * @param {string} userId - 사용자 ID
       * @param {string} authToken - 인증 토큰
       * @returns {Promise<void>}
       * @description Socket.IO 연결, 이벤트 리스너 설정, 채팅방 목록 로드
       */
      initializeChat: async (userId: string, authToken: string) => {
        set({ isLoading: true, error: null });

        try {
          // 개발 환경에서는 mock 연결
          if (__DEV__) {
            console.log('[chatSlice] Mock 채팅 초기화:', { userId });
            // 약간의 로딩 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 500));
            
            set({ 
              connectionState: { 
                isConnected: true, 
                isReconnecting: false, 
                lastConnectedAt: Date.now() 
              } 
            });
          } else {
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
          }

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

      /**
       * 채팅방 목록 로드
       * @async
       * @returns {Promise<void>}
       * @description 서버에서 매칭된 채팅방 목록을 가져옴
       */
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

      /**
       * 채팅방 참여
       * @param {string} roomId - 채팅방 ID
       * @description Socket.IO로 채팅방에 참여하고 활성 방으로 설정
       */
      joinRoom: (roomId: string) => {
        chatService.joinMatch(roomId);
        set({ activeRoomId: roomId });
        
        // 해당 방의 타이핑 사용자 초기화
        get().clearTypingUsers(roomId);
      },

      /**
       * 채팅방 나가기
       * @param {string} roomId - 채팅방 ID
       * @description Socket.IO로 채팅방에서 나가고 타이핑 상태 초기화
       */
      leaveRoom: (roomId: string) => {
        chatService.leaveMatch(roomId);
        if (get().activeRoomId === roomId) {
          set({ activeRoomId: null });
        }
        
        // 해당 방의 타이핑 사용자 초기화
        get().clearTypingUsers(roomId);
      },

      /**
       * 활성 채팅방 설정
       * @param {string | null} roomId - 채팅방 ID 또는 null
       * @description 기존 방에서 나가고 새 방으로 참여
       */
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

      /**
       * 메시지 히스토리 로드
       * @async
       * @param {string} roomId - 채팅방 ID
       * @param {number} [page=1] - 페이지 번호
       * @returns {Promise<void>}
       * @description 특정 채팅방의 메시지 기록을 페이지네이션으로 로드
       */
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

      /**
       * 메시지 전송
       * @async
       * @param {string} roomId - 채팅방 ID
       * @param {string} content - 메시지 내용
       * @param {string} [type='TEXT'] - 메시지 타입
       * @returns {Promise<void>}
       * @description 메시지를 전송하고 오프라인 시 큐에 저장
       */
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
          
          // 개발 환경에서는 로컬 상태도 업데이트
          if (__DEV__) {
            const newMessage: Message = {
              id: `msg_${Date.now()}`,
              matchId: roomId,
              senderId: 'current_user',
              content,
              type,
              isRead: true,
              isEncrypted: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            set((state) => ({
              messages: {
                ...state.messages,
                [roomId]: [...(state.messages[roomId] || []), newMessage],
              },
            }));
          }
          
        } catch (error) {
          console.error('Failed to send message:', error);
          set({ error: error instanceof Error ? error.message : '메시지 전송에 실패했습니다.' });
        }
      },

      /**
       * 메시지 추가 (실시간 수신)
       * @param {Message} message - 추가할 메시지
       * @description WebSocket으로 수신한 메시지를 상태에 추가 (중복 체크)
       */
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

      /**
       * 메시지 읽음 표시
       * @param {string} messageId - 메시지 ID
       * @param {string} roomId - 채팅방 ID
       * @description 메시지를 읽음으로 표시하고 서버에 알림
       */
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

      /**
       * 타이핑 상태 전송
       * @param {string} roomId - 채팅방 ID
       * @param {boolean} isTyping - 타이핑 여부
       * @description 자신의 타이핑 상태를 다른 사용자에게 알림
       */
      setTypingStatus: (roomId: string, isTyping: boolean) => {
        if (isTyping) {
          chatService.startTyping(roomId);
        } else {
          chatService.stopTyping(roomId);
        }
      },

      /**
       * 타이핑 사용자 추가
       * @param {string} userId - 사용자 ID
       * @param {string} nickname - 사용자 닉네임
       * @param {string} roomId - 채팅방 ID
       * @description 타이핑 중인 사용자를 목록에 추가 (타임스탬프 포함)
       */
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

      /**
       * 타이핑 사용자 제거
       * @param {string} userId - 사용자 ID
       * @param {string} roomId - 채팅방 ID
       * @description 특정 사용자를 타이핑 목록에서 제거
       */
      removeTypingUser: (userId: string, roomId: string) => {
        set((state) => ({
          typingUsers: state.typingUsers.filter(
            user => !(user.userId === userId && user.roomId === roomId)
          ),
        }));
      },

      /**
       * 특정 방의 타이핑 사용자 초기화
       * @param {string} roomId - 채팅방 ID
       * @description 특정 채팅방의 모든 타이핑 상태를 초기화
       */
      clearTypingUsers: (roomId: string) => {
        set((state) => ({
          typingUsers: state.typingUsers.filter(user => user.roomId !== roomId),
        }));
      },

      /**
       * 에러 초기화
       * @description 에러 메시지를 초기화
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * 연결 해제
       * @description WebSocket 연결을 해제하고 타이핑 정리 중지
       */
      disconnect: () => {
        chatService.disconnect();
        get().stopTypingCleanup();
        set({ activeRoomId: null, typingUsers: [] });
      },

      /**
       * 타이핑 사용자 정리 시작
       * @description 5초마다 오래된 타이핑 상태를 자동 제거 (메모리 누수 방지)
       */
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

      /**
       * 타이핑 사용자 정리 중지
       * @description 타이핑 정리 타이머를 중지
       */
      stopTypingCleanup: () => {
        if (typingCleanupInterval) {
          clearInterval(typingCleanupInterval);
          typingCleanupInterval = null;
        }
      },

      /**
       * 오프라인 메시지 처리
       * @async
       * @returns {Promise<void>}
       * @description 연결 복구 시 큐에 저장된 오프라인 메시지를 전송
       */
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

      /**
       * 연결 상태 업데이트
       * @param {boolean} isConnected - 연결 여부
       * @param {boolean} isReconnecting - 재연결 중 여부
       * @description WebSocket 연결 상태를 업데이트
       */
      updateConnectionState: (isConnected: boolean, isReconnecting: boolean) => {
        set((state) => ({
          connectionState: {
            isConnected,
            isReconnecting,
            lastConnectedAt: isConnected ? Date.now() : state.connectionState.lastConnectedAt,
          },
        }));
      },

      /**
       * 재연결 처리
       * @description 연결 복구 시 오프라인 메시지 전송 및 채팅방 재로드
       */
      handleReconnect: () => {
        get().updateConnectionState(true, false);
        get().processOfflineMessages();
        get().loadChatRooms();
      },

      /**
       * 상태 초기화
       * @description 모든 채팅 상태를 초기값으로 리셋
       */
      reset: () => {
        get().disconnect();
        set(initialState);
      },
    }),
    {
      /** 저장소 키 이름 */
      name: 'chat-storage',
      /** AsyncStorage를 사용하는 커스텀 저장소 */
      storage: createJSONStorage(() => AsyncStorage),
      /**
       * 영속화할 상태 선택
       * @description 채팅방 목록만 저장, 메시지는 보안상 메모리에만 유지
       */
      partialize: (state) => ({
        chatRooms: state.chatRooms,
        // messages는 보안상 메모리에만 저장
      }),
    }
  )
);

/**
 * 채팅 선택자 함수들
 * @namespace chatSelectors
 * @description 채팅 상태에서 특정 데이터를 선택하는 헬퍼 함수들
 */
export const chatSelectors = {
  /**
   * 특정 방의 메시지 가져오기
   * @param {string} roomId - 채팅방 ID
   * @returns {Function} 선택자 함수
   */
  getMessages: (roomId: string) => (state: ChatStore) => state.messages[roomId] || [],
  
  /**
   * 특정 방의 읽지 않은 메시지 수
   * @param {string} roomId - 채팅방 ID
   * @returns {Function} 선택자 함수
   * @todo 현재 사용자 ID를 authStore에서 가져와야 함
   */
  getUnreadCount: (roomId: string) => (state: ChatStore) => {
    const messages = state.messages[roomId] || [];
    // TODO: 현재 사용자 ID를 authStore에서 가져와야 함
    return messages.filter(msg => !msg.isRead).length;
  },
  
  /**
   * 특정 방의 타이핑 사용자들
   * @param {string} roomId - 채팅방 ID
   * @returns {Function} 선택자 함수
   */
  getTypingUsers: (roomId: string) => (state: ChatStore) =>
    state.typingUsers.filter(user => user.roomId === roomId),
  
  /**
   * 총 읽지 않은 메시지 수
   * @returns {Function} 선택자 함수
   * @description 모든 채팅방의 읽지 않은 메시지 합계
   */
  getTotalUnreadCount: () => (state: ChatStore) => {
    return state.chatRooms.reduce((total, room) => {
      return total + chatSelectors.getUnreadCount(room.id)(state);
    }, 0);
  },
};