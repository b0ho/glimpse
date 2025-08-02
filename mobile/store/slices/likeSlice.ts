import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Like, Match } from '@/types';
import { LIKE_SYSTEM } from '@/utils/constants';
import { useAuthStore } from './authSlice';

/**
 * 좋아요 상태 인터페이스
 * @interface LikeState
 * @description 좋아요, 매칭, 일일 한도 등의 상태 정의
 */
interface LikeState {
  // State
  /** 보낸 좋아요 목록 */
  sentLikes: Like[];
  /** 받은 좋아요 목록 */
  receivedLikes: Like[];
  /** 매칭 목록 */
  matches: Match[];
  
  // Daily limits
  /** 오늘 사용한 좋아요 수 */
  dailyLikesUsed: number;
  /** 마지막 리셋 날짜 (ISO date string) */
  lastResetDate: string;
  
  // Premium features
  /** 프리미엄 구독 여부 */
  hasPremium: boolean;
  /** 남은 프리미엄 좋아요 수 */
  premiumLikesRemaining: number;
  
  // Super Likes (Premium only)
  /** 오늘 사용한 슈퍼 좋아요 수 */
  superLikesUsed: number;
  /** 일일 슈퍼 좋아요 제한 (프리미엄 사용자만) */
  dailySuperLikesLimit: number;
  
  // UI state
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
}

/**
 * 좋아요 스토어 인터페이스
 * @interface LikeStore
 * @extends {LikeState}
 * @description 좋아요 시스템의 모든 액션과 계산된 값 정의
 */
interface LikeStore extends LikeState {
  // Actions
  /** 일반 좋아요 보내기 */
  sendLike: (toUserId: string, groupId: string) => Promise<boolean>;
  /** 슈퍼 좋아요 보내기 (프리미엄 전용) */
  sendSuperLike: (toUserId: string, groupId: string) => Promise<boolean>;
  /** 매치 생성 */
  createMatch: (match: Match) => void;
  /** 보낸 좋아요 목록 설정 */
  setSentLikes: (likes: Like[]) => void;
  /** 받은 좋아요 목록 설정 */
  setReceivedLikes: (likes: Like[]) => void;
  /** 매치 목록 설정 */
  setMatches: (matches: Match[]) => void;
  /** 로딩 상태 설정 */
  setLoading: (isLoading: boolean) => void;
  /** 에러 메시지 설정 */
  setError: (error: string | null) => void;
  
  // Cancel and history management
  /** 좋아요 취소 (24시간 내) */
  cancelLike: (likeId: string) => Promise<boolean>;
  /** 좋아요 기록 삭제 */
  deleteLikeHistory: (likeIds: string[]) => Promise<boolean>;
  /** 좋아요 목록 새로고침 */
  refreshLikes: () => Promise<void>;
  
  // Premium actions
  /** 프리미엄 좋아요 구매 */
  purchasePremiumLikes: (count: number) => void;
  /** 프리미엄 상태 설정 */
  setPremiumStatus: (hasPremium: boolean) => void;
  /** 프리미엄 스토어와 동기화 */
  syncWithPremiumStore: () => void;
  
  // Super Like actions
  /** 슈퍼 좋아요 가능 여부 확인 */
  canSendSuperLike: () => boolean;
  /** 남은 슈퍼 좋아요 수 */
  getRemainingSuperLikes: () => number;
  
  // Rewind actions (Premium only)
  /** 좋아요 되돌리기 가능 여부 */
  canRewindLike: () => boolean;
  /** 마지막 좋아요 되돌리기 */
  rewindLastLike: () => Promise<boolean>;
  /** 마지막 좋아요 조회 */
  getLastLike: () => Like | null;
  
  // Computed values
  /** 좋아요 가능 여부 확인 */
  canSendLike: (toUserId: string) => boolean;
  /** 남은 무료 좋아요 수 */
  getRemainingFreeLikes: () => number;
  /** 특정 사용자에게 좋아요 보냈는지 확인 */
  hasLikedUser: (userId: string) => boolean;
  /** 특정 사용자에게 슈퍼 좋아요 보냈는지 확인 */
  isSuperLikedUser: (userId: string) => boolean;
  /** 특정 사용자와 매칭되었는지 확인 */
  isMatchedWith: (userId: string) => boolean;
  /** 받은 좋아요 수 */
  getReceivedLikesCount: () => number;
  
  // Anonymity system
  /** 익명 사용자 정보 조회 */
  getAnonymousUserInfo: (userId: string, currentUserId: string) => import('@/types').AnonymousUserInfo | null;
  /** 사용자 표시 이름 조회 */
  getUserDisplayName: (userId: string, currentUserId: string) => string;
  
  // Location-based matching
  /** 위치 기반 매칭 조회 */
  getLocationBasedMatches: (userLocation?: { latitude: number; longitude: number }) => Array<{
    id: string;
    nickname: string;
    distance: number;
    commonGroups: number;
    matchingScore: number;
    lastActive: Date;
    locationScore: number;
  }>;
  /** 위치 기반 매칭 점수 계산 */
  calculateLocationMatchingScore: (userId: string, userLocation?: { latitude: number; longitude: number }) => number;
  
  // Daily reset
  /** 일일 한도 리셋 */
  resetDailyLimits: () => void;
  /** 일일 리셋 확인 및 실행 */
  checkAndResetDaily: () => void;
}

/**
 * SecureStore를 위한 커스텀 스토리지 어댑터
 * @constant secureStorage
 * @description Expo SecureStore를 Zustand persist 미들웨어와 호환되도록 래핑
 */
const secureStorage = {
  /**
   * 안전한 저장소에서 값 가져오기
   * @async
   * @param {string} name - 저장소 키
   * @returns {Promise<string | null>} 저장된 값 또는 null
   */
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return null;
    }
  },
  /**
   * 안전한 저장소에 값 저장
   * @async
   * @param {string} name - 저장소 키
   * @param {string} value - 저장할 값
   * @returns {Promise<void>}
   */
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  },
  /**
   * 안전한 저장소에서 값 제거
   * @async
   * @param {string} name - 저장소 키
   * @returns {Promise<void>}
   */
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
  },
};

/**
 * 좋아요 상태 관리 스토어
 * @constant useLikeStore
 * @description 좋아요, 매칭, 슈퍼 좋아요 등 모든 좋아요 관련 기능을 관리하는 Zustand 스토어
 * @example
 * ```typescript
 * const { sendLike, canSendLike, matches } = useLikeStore();
 * ```
 */
export const useLikeStore = create<LikeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      /** 보낸 좋아요 목록 */
      sentLikes: [],
      /** 받은 좋아요 목록 */
      receivedLikes: [],
      /** 매칭 목록 */
      matches: [],
      /** 오늘 사용한 좋아요 수 */
      dailyLikesUsed: 0,
      /** 마지막 리셋 날짜 */
      lastResetDate: new Date().toISOString().split('T')[0],
      /** 프리미엄 구독 여부 */
      hasPremium: false,
      /** 남은 프리미엄 좋아요 수 */
      premiumLikesRemaining: 0,
      /** 오늘 사용한 슈퍼 좋아요 수 */
      superLikesUsed: 0,
      /** 일일 슈퍼 좋아요 제한 (프리미엄 사용자만) */
      dailySuperLikesLimit: 3,
      /** 로딩 상태 */
      isLoading: false,
      /** 에러 메시지 */
      error: null,

      // Actions
      /**
       * 일반 좋아요 보내기
       * @async
       * @param {string} toUserId - 받는 사용자 ID
       * @param {string} groupId - 그룹 ID
       * @returns {Promise<boolean>} 성공 여부
       * @description 일일 한도와 쿨다운 확인 후 좋아요 전송
       */
      sendLike: async (toUserId: string, groupId: string): Promise<boolean> => {
        const state = get();
        
        // 일일 체크 및 리셋
        state.checkAndResetDaily();
        
        // 좋아요 가능 여부 확인
        if (!state.canSendLike(toUserId)) {
          set({ error: '이미 좋아요를 보낸 사용자이거나 일일 한도에 도달했습니다.' });
          return false;
        }
        
        try {
          set({ isLoading: true, error: null });
          
          // API 호출 (실제 구현에서는 서버 API 호출)
          const newLike: Like = {
            id: `like_${Date.now()}`,
            fromUserId: useAuthStore.getState().user?.id || 'anonymous', // 현재 로그인된 사용자 ID
            toUserId,
            groupId,
            isAnonymous: true,
            isSuper: false, // 일반 좋아요
            createdAt: new Date(),
          };
          
          // 상태 업데이트
          set((state) => ({
            sentLikes: [...state.sentLikes, newLike],
            dailyLikesUsed: state.dailyLikesUsed + 1,
            isLoading: false,
          }));

          // 매치 확인 (받은 좋아요가 있는지 확인)
          const receivedLikeFromSameUser = state.receivedLikes.find(
            like => like.fromUserId === toUserId && like.toUserId === (useAuthStore.getState().user?.id || 'anonymous')
          );

          if (receivedLikeFromSameUser) {
            // 매치 생성!
            const newMatch: Match = {
              id: `match_${Date.now()}`,
              user1Id: useAuthStore.getState().user?.id || 'anonymous',
              user2Id: toUserId,
              groupId,
              createdAt: new Date(),
              lastMessageAt: null,
              isActive: true,
              updatedAt: new Date(),
            };

            state.createMatch(newMatch);

            // 새 매치 알림 전송
            if (typeof window !== 'undefined') {
              // 알림 설정 확인 후 전송
              import('../slices/notificationSlice').then(({ useNotificationStore }) => {
                const notificationState = useNotificationStore.getState();
                if (notificationState.settings.pushEnabled && notificationState.settings.newMatches) {
                  // 실제 사용자 이름 가져오기 (더미 데이터)
                  const userName = `사용자${toUserId.slice(-4)}`;
                  // notification service를 직접 사용
                  import('../../services/notifications/notification-service').then(({ notificationService }) => {
                    notificationService.notifyNewMatch(newMatch.id, userName);
                  });
                }
              });
            }
          }
          
          return true;
        } catch (error) {
          console.error('Send like error:', error);
          set({ 
            error: '좋아요 전송에 실패했습니다.',
            isLoading: false,
          });
          return false;
        }
      },

      /**
       * 슈퍼 좋아요 보내기 (프리미엄 전용)
       * @async
       * @param {string} toUserId - 받는 사용자 ID
       * @param {string} groupId - 그룹 ID
       * @returns {Promise<boolean>} 성공 여부
       * @description 프리미엄 사용자만 사용 가능한 비익명 슈퍼 좋아요
       */
      sendSuperLike: async (toUserId: string, groupId: string): Promise<boolean> => {
        const state = get();
        
        // 프리미엄 사용자인지 확인
        if (!state.hasPremium) {
          set({ error: '슈퍼 좋아요는 프리미엄 사용자만 사용할 수 있습니다.' });
          return false;
        }
        
        // 일일 체크 및 리셋
        state.checkAndResetDaily();
        
        // 슈퍼 좋아요 가능 여부 확인
        if (!state.canSendSuperLike()) {
          set({ error: '일일 슈퍼 좋아요 한도에 도달했습니다.' });
          return false;
        }
        
        // 이미 좋아요를 보낸 사용자인지 확인
        if (state.hasLikedUser(toUserId) || state.isSuperLikedUser(toUserId)) {
          set({ error: '이미 좋아요를 보낸 사용자입니다.' });
          return false;
        }
        
        try {
          set({ isLoading: true, error: null });
          
          // API 호출 (실제 구현에서는 서버 API 호출)
          const newSuperLike: Like = {
            id: `super_like_${Date.now()}`,
            fromUserId: useAuthStore.getState().user?.id || 'anonymous', // 현재 로그인된 사용자 ID
            toUserId,
            groupId,
            isAnonymous: false, // 슈퍼 좋아요는 비익명
            isSuper: true, // 슈퍼 좋아요
            createdAt: new Date(),
          };
          
          // 상태 업데이트
          set((state) => ({
            sentLikes: [...state.sentLikes, newSuperLike],
            superLikesUsed: state.superLikesUsed + 1,
            isLoading: false,
          }));

          // 슈퍼 좋아요는 즉시 상대방에게 알림 전송
          if (typeof window !== 'undefined') {
            // 알림 설정 확인 후 전송
            import('../slices/notificationSlice').then(({ useNotificationStore }) => {
              const notificationState = useNotificationStore.getState();
              if (notificationState.settings.pushEnabled && notificationState.settings.superLikes) {
                const userName = `사용자${toUserId.slice(-4)}`;
                import('../../services/notifications/notification-service').then(({ notificationService }) => {
                  // 슈퍼 좋아요 전용 알림
                  notificationService.notifySuperLikeReceived(newSuperLike.id, userName);
                });
              }
            });
          }

          // 매치 확인 (받은 좋아요가 있는지 확인)
          const receivedLikeFromSameUser = state.receivedLikes.find(
            like => like.fromUserId === toUserId && like.toUserId === (useAuthStore.getState().user?.id || 'anonymous')
          );

          if (receivedLikeFromSameUser) {
            // 슈퍼 좋아요 매치 생성!
            const newMatch: Match = {
              id: `super_match_${Date.now()}`,
              user1Id: useAuthStore.getState().user?.id || 'anonymous',
              user2Id: toUserId,
              groupId,
              createdAt: new Date(),
              lastMessageAt: null,
              isActive: true,
              updatedAt: new Date(),
            };

            state.createMatch(newMatch);

            // 슈퍼 매치 특별 알림
            if (typeof window !== 'undefined') {
              // 알림 설정 확인 후 전송
              import('../slices/notificationSlice').then(({ useNotificationStore }) => {
                const notificationState = useNotificationStore.getState();
                if (notificationState.settings.pushEnabled && notificationState.settings.newMatches) {
                  const userName = `사용자${toUserId.slice(-4)}`;
                  import('../../services/notifications/notification-service').then(({ notificationService }) => {
                    notificationService.notifySuperMatch(newMatch.id, userName);
                  });
                }
              });
            }
          }
          
          return true;
        } catch (error) {
          console.error('Send super like error:', error);
          set({ 
            error: '슈퍼 좋아요 전송에 실패했습니다.',
            isLoading: false,
          });
          return false;
        }
      },

      /**
       * 매치 생성
       * @param {Match} match - 생성할 매치 정보
       * @description 새로운 매치를 상태에 추가
       */
      createMatch: (match: Match) => {
        set((state) => ({
          matches: [...state.matches, match],
        }));
      },

      /**
       * 보낸 좋아요 목록 설정
       * @param {Like[]} likes - 좋아요 목록
       */
      setSentLikes: (likes: Like[]) => {
        set({ sentLikes: likes });
      },

      /**
       * 받은 좋아요 목록 설정
       * @param {Like[]} likes - 좋아요 목록
       * @description 새로운 좋아요 수신 시 프리미엄 사용자에게 알림 전송
       */
      setReceivedLikes: (likes: Like[]) => {
        const state = get();
        const previousLikes = state.receivedLikes;
        
        set({ receivedLikes: likes });

        // 새로운 좋아요가 있는지 확인 (프리미엄 기능)
        const newLikes = likes.filter(like => 
          !previousLikes.some(prevLike => prevLike.id === like.id)
        );

        if (newLikes.length > 0) {
          // 알림 전송 (프리미엄 사용자만)
          import('../slices/premiumSlice').then(({ usePremiumStore }) => {
            const premiumState = usePremiumStore.getState();
            if (premiumState.subscription?.isActive) {
              import('../../services/notifications/notification-service').then(({ notificationService }) => {
                import('../slices/notificationSlice').then(({ useNotificationStore }) => {
                  const notificationState = useNotificationStore.getState();
                  if (notificationState.settings.likesReceived && notificationState.settings.pushEnabled) {
                    newLikes.forEach(like => {
                      notificationService.notifyLikeReceived(like.fromUserId, true);
                    });
                  }
                });
              });
            }
          });
        }
      },

      /**
       * 매치 목록 설정
       * @param {Match[]} matches - 매치 목록
       */
      setMatches: (matches: Match[]) => {
        set({ matches });
      },

      /**
       * 로딩 상태 설정
       * @param {boolean} isLoading - 로딩 여부
       */
      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      /**
       * 에러 메시지 설정
       * @param {string | null} error - 에러 메시지
       */
      setError: (error: string | null) => {
        set({ error });
      },

      /**
       * 좋아요 취소
       * @async
       * @param {string} likeId - 취소할 좋아요 ID
       * @returns {Promise<boolean>} 성공 여부
       * @description 24시간 이내에 보낸 좋아요만 취소 가능
       */
      cancelLike: async (likeId: string): Promise<boolean> => {
        const state = get();
        
        // Find the like to cancel
        const likeToCancel = state.sentLikes.find(like => like.id === likeId);
        if (!likeToCancel) {
          set({ error: '취소할 좋아요를 찾을 수 없습니다.' });
          return false;
        }
        
        // Check if cancellation is allowed (within 24 hours)
        const timePassed = Date.now() - new Date(likeToCancel.createdAt).getTime();
        if (timePassed > 24 * 60 * 60 * 1000) {
          set({ error: '24시간이 지난 좋아요는 취소할 수 없습니다.' });
          return false;
        }
        
        try {
          set({ isLoading: true, error: null });
          
          // API 호출 (실제 구현에서는 서버 API 호출)
          // TODO: 실제 API 엔드포인트 구현 필요
          
          // Remove from sentLikes
          set((state) => ({
            sentLikes: state.sentLikes.filter(like => like.id !== likeId),
            isLoading: false,
          }));
          
          // If there was a match with this user, remove it
          const existingMatch = state.matches.find(
            match => (match.user1Id === likeToCancel.fromUserId && match.user2Id === likeToCancel.toUserId) ||
                     (match.user2Id === likeToCancel.fromUserId && match.user1Id === likeToCancel.toUserId)
          );
          
          if (existingMatch) {
            set((state) => ({
              matches: state.matches.filter(match => match.id !== existingMatch.id)
            }));
          }
          
          return true;
        } catch (error) {
          console.error('Cancel like error:', error);
          set({ 
            error: '좋아요 취소에 실패했습니다.',
            isLoading: false,
          });
          return false;
        }
      },

      /**
       * 좋아요 기록 삭제
       * @async
       * @param {string[]} likeIds - 삭제할 좋아요 ID 배열
       * @returns {Promise<boolean>} 성공 여부
       * @description 여러 개의 좋아요 기록을 일괄 삭제
       */
      deleteLikeHistory: async (likeIds: string[]): Promise<boolean> => {
        if (likeIds.length === 0) {
          set({ error: '삭제할 항목이 없습니다.' });
          return false;
        }
        
        try {
          set({ isLoading: true, error: null });
          
          // API 호출 (실제 구현에서는 서버 API 호출)
          // TODO: 실제 API 엔드포인트 구현 필요
          
          // Remove from sentLikes
          set((state) => ({
            sentLikes: state.sentLikes.filter(like => !likeIds.includes(like.id)),
            isLoading: false,
          }));
          
          return true;
        } catch (error) {
          console.error('Delete like history error:', error);
          set({ 
            error: '이력 삭제에 실패했습니다.',
            isLoading: false,
          });
          return false;
        }
      },

      /**
       * 좋아요 목록 새로고침
       * @async
       * @returns {Promise<void>}
       * @description 서버에서 최신 좋아요 목록을 가져옴
       */
      refreshLikes: async (): Promise<void> => {
        try {
          set({ isLoading: true, error: null });
          
          // API 호출 (실제 구현에서는 서버 API 호출)
          // TODO: 실제 API 엔드포인트 구현 필요
          
          // For now, just set loading to false
          set({ isLoading: false });
        } catch (error) {
          console.error('Refresh likes error:', error);
          set({ 
            error: '좋아요 목록을 불러오는데 실패했습니다.',
            isLoading: false,
          });
        }
      },

      /**
       * 프리미엄 좋아요 구매
       * @param {number} count - 구매할 좋아요 수
       * @description 추가 좋아요를 프리미엄 잔액에 추가
       */
      purchasePremiumLikes: (count: number) => {
        set((state) => ({
          premiumLikesRemaining: state.premiumLikesRemaining + count,
        }));
      },

      /**
       * 프리미엄 상태 설정
       * @param {boolean} hasPremium - 프리미엄 구독 여부
       */
      setPremiumStatus: (hasPremium: boolean) => {
        set({ hasPremium });
      },
      
      /**
       * 프리미엄 스토어와 동기화
       * @description 프리미엄 상태와 남은 좋아요 수를 동기화
       */
      syncWithPremiumStore: () => {
        // Import premium store dynamically to avoid circular dependency
        import('./premiumSlice').then(({ usePremiumStore, premiumSelectors }) => {
          const premiumState = usePremiumStore.getState();
          const isPremium = premiumSelectors.isPremiumUser()(premiumState);
          const remainingLikes = premiumSelectors.getRemainingLikes()(premiumState);
          
          set(state => ({
            hasPremium: isPremium,
            premiumLikesRemaining: isPremium ? 999 : Math.max(0, remainingLikes - state.dailyLikesUsed)
          }));
        });
      },

      /**
       * 좋아요 가능 여부 확인
       * @param {string} toUserId - 대상 사용자 ID
       * @returns {boolean} 좋아요 가능 여부
       * @description 일일 한도, 쿨다운, 중복 여부를 확인
       */
      canSendLike: (toUserId: string) => {
        const state = get();
        
        // 이미 좋아요를 보낸 사용자인지 확인
        const hasLiked = state.sentLikes.some((like) => like.toUserId === toUserId);
        if (hasLiked) return false;
        
        // 2주 쿨다운 확인
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - LIKE_SYSTEM.COOLDOWN_PERIOD_DAYS);
        
        const recentLike = state.sentLikes.find((like) => {
          const likeCreatedAt = typeof like.createdAt === 'string' 
            ? new Date(like.createdAt) 
            : like.createdAt;
          return like.toUserId === toUserId && likeCreatedAt > twoWeeksAgo;
        });
        if (recentLike) return false;
        
        // 일일 한도 확인
        const remainingLikes = state.getRemainingFreeLikes();
        return remainingLikes > 0 || state.premiumLikesRemaining > 0;
      },

      /**
       * 남은 무료 좋아요 수 조회
       * @returns {number} 남은 무료 좋아요 수
       */
      getRemainingFreeLikes: () => {
        const state = get();
        return Math.max(0, LIKE_SYSTEM.DAILY_FREE_LIKES - state.dailyLikesUsed);
      },

      /**
       * 특정 사용자에게 좋아요를 보냈는지 확인
       * @param {string} userId - 사용자 ID
       * @returns {boolean} 좋아요 여부
       */
      hasLikedUser: (userId: string) => {
        return get().sentLikes.some((like) => like.toUserId === userId && !like.isSuper);
      },

      /**
       * 특정 사용자에게 슈퍼 좋아요를 보냈는지 확인
       * @param {string} userId - 사용자 ID
       * @returns {boolean} 슈퍼 좋아요 여부
       */
      isSuperLikedUser: (userId: string) => {
        return get().sentLikes.some((like) => like.toUserId === userId && like.isSuper);
      },

      /**
       * 슈퍼 좋아요 가능 여부 확인
       * @returns {boolean} 슈퍼 좋아요 가능 여부
       * @description 프리미엄 사용자이고 일일 한도 미달인 경우 true
       */
      canSendSuperLike: () => {
        const state = get();
        
        // 프리미엄 사용자인지 확인
        if (!state.hasPremium) return false;
        
        // 일일 슈퍼 좋아요 한도 확인
        return state.superLikesUsed < state.dailySuperLikesLimit;
      },

      /**
       * 남은 슈퍼 좋아요 수 조회
       * @returns {number} 남은 슈퍼 좋아요 수
       */
      getRemainingSuperLikes: () => {
        const state = get();
        if (!state.hasPremium) return 0;
        return Math.max(0, state.dailySuperLikesLimit - state.superLikesUsed);
      },

      /**
       * 좋아요 되돌리기 가능 여부 확인
       * @returns {boolean} 되돌리기 가능 여부
       * @description 프리미엄 사용자이고 5분 이내 좋아요인 경우 true
       */
      canRewindLike: () => {
        const state = get();
        
        // 프리미엄 사용자인지 확인
        if (!state.hasPremium) return false;
        
        // 보낸 좋아요가 있어야 함
        if (state.sentLikes.length === 0) return false;
        
        // 마지막 좋아요가 5분 이내에 보낸 것인지 확인 (되돌리기 제한 시간)
        const lastLike = state.getLastLike();
        if (!lastLike) return false;
        
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000); // 5분 전
        const likeCreatedAt = typeof lastLike.createdAt === 'string' 
          ? new Date(lastLike.createdAt) 
          : lastLike.createdAt;
        return likeCreatedAt > fiveMinutesAgo;
      },

      /**
       * 마지막 좋아요 조회
       * @returns {Like | null} 가장 최근 좋아요
       * @description 가장 최근에 보낸 좋아요 정보 반환
       */
      getLastLike: () => {
        const state = get();
        if (state.sentLikes.length === 0) return null;
        
        // 가장 최근에 보낸 좋아요 반환 (시간 순 정렬)
        const sortedLikes = [...state.sentLikes].sort((a, b) => {
          const aTime = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : a.createdAt.getTime();
          const bTime = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : b.createdAt.getTime();
          return bTime - aTime;
        });
        
        return sortedLikes[0];
      },

      /**
       * 마지막 좋아요 되돌리기
       * @async
       * @returns {Promise<boolean>} 성공 여부
       * @description 프리미엄 전용 기능으로 5분 이내 좋아요만 취소 가능
       */
      rewindLastLike: async () => {
        const state = get();
        
        // 되돌리기 가능 여부 확인
        if (!state.canRewindLike()) {
          set({ error: '좋아요 되돌리기를 사용할 수 없습니다.' });
          return false;
        }
        
        const lastLike = state.getLastLike();
        if (!lastLike) {
          set({ error: '되돌릴 좋아요가 없습니다.' });
          return false;
        }
        
        try {
          set({ isLoading: true, error: null });
          
          // API 호출 (실제 구현에서는 서버 API 호출)
          // TODO: 실제 API 엔드포인트 구현 필요
          
          // 상태에서 해당 좋아요 제거
          set((state) => ({
            sentLikes: state.sentLikes.filter(like => like.id !== lastLike.id),
            // 일반 좋아요인 경우 dailyLikesUsed 감소
            dailyLikesUsed: !lastLike.isSuper && state.dailyLikesUsed > 0 
              ? state.dailyLikesUsed - 1 
              : state.dailyLikesUsed,
            // 슈퍼 좋아요인 경우 superLikesUsed 감소
            superLikesUsed: lastLike.isSuper && state.superLikesUsed > 0 
              ? state.superLikesUsed - 1 
              : state.superLikesUsed,
            isLoading: false,
          }));
          
          // 해당 사용자와의 매치가 있었다면 제거
          const currentUserId = useAuthStore.getState().user?.id || 'anonymous';
          const existingMatch = state.matches.find(
            match => (match.user1Id === currentUserId && match.user2Id === lastLike.toUserId) ||
                    (match.user2Id === currentUserId && match.user1Id === lastLike.toUserId)
          );
          
          if (existingMatch) {
            // 매치도 함께 제거 (서로 좋아요로만 매치된 경우)
            const otherUserLike = state.receivedLikes.find(
              like => like.fromUserId === lastLike.toUserId
            );
            
            if (otherUserLike) {
              // 상대방도 좋아요를 보낸 상태였다면 매치 제거
              set((state) => ({
                matches: state.matches.filter(match => match.id !== existingMatch.id)
              }));
            }
          }
          
          return true;
        } catch (error) {
          console.error('Rewind like error:', error);
          set({ 
            error: '좋아요 되돌리기에 실패했습니다.',
            isLoading: false,
          });
          return false;
        }
      },

      /**
       * 특정 사용자와 매칭 여부 확인
       * @param {string} userId - 사용자 ID
       * @returns {boolean} 매칭 여부
       */
      isMatchedWith: (userId: string) => {
        const state = get();
        return state.matches.some(
          (match) => match.user1Id === userId || match.user2Id === userId
        );
      },

      /**
       * 받은 좋아요 수 조회
       * @returns {number} 받은 좋아요 수
       */
      getReceivedLikesCount: () => {
        return get().receivedLikes.length;
      },

      /**
       * 익명 사용자 정보 조회
       * @param {string} userId - 대상 사용자 ID
       * @param {string} currentUserId - 현재 사용자 ID
       * @returns {AnonymousUserInfo | null} 익명 사용자 정보
       * @description 매칭 여부에 따라 실명 또는 닉네임 반환
       */
      getAnonymousUserInfo: (userId: string, currentUserId: string) => {
        const state = get();
        
        // 더미 사용자 데이터에서 사용자 정보 찾기
        const { dummyUsers } = require('@/utils/mockData');
        const user = dummyUsers.find((u: import('@/types').User) => u.id === userId);
        
        if (!user) {
          return null;
        }

        // 매칭 여부 확인
        const isMatched = state.matches.some(
          match => (match.user1Id === currentUserId && match.user2Id === userId) ||
                   (match.user2Id === currentUserId && match.user1Id === userId)
        );

        // 익명성 규칙 적용: 매칭된 경우에만 실명 공개
        return {
          id: user.id,
          anonymousId: user.anonymousId,
          displayName: isMatched && user.realName ? user.realName : user.nickname,
          nickname: user.nickname,
          realName: isMatched ? user.realName : undefined,
          isMatched,
          gender: user.gender,
        };
      },

      /**
       * 사용자 표시 이름 조회
       * @param {string} userId - 대상 사용자 ID
       * @param {string} currentUserId - 현재 사용자 ID
       * @returns {string} 표시할 이름
       */
      getUserDisplayName: (userId: string, currentUserId: string) => {
        const anonymousInfo = get().getAnonymousUserInfo(userId, currentUserId);
        return anonymousInfo?.displayName || '알 수 없는 사용자';
      },

      /**
       * 위치 기반 매칭 조회
       * @param {Object} [userLocation] - 사용자 위치
       * @param {number} userLocation.latitude - 위도
       * @param {number} userLocation.longitude - 경도
       * @returns {Array} 근처 사용자 목록
       * @description 위치 기반으로 근처 사용자를 매칭 점수 순으로 정렬
       */
      getLocationBasedMatches: (userLocation) => {
        if (!userLocation) return [];

        // TODO: 실제 구현에서는 서버 API로 근처 사용자 데이터 가져오기
        // 더미 데이터
        const nearbyUsers = [
          {
            id: 'nearby_1',
            nickname: '커피러버',
            distance: 150,
            commonGroups: 1,
            matchingScore: 0.85,
            lastActive: new Date(),
          },
          {
            id: 'nearby_2',
            nickname: '운동좋아',
            distance: 300,
            commonGroups: 2,
            matchingScore: 0.92,
            lastActive: new Date(Date.now() - 10 * 60 * 1000),
          },
          {
            id: 'nearby_3',
            nickname: '음악매니아',
            distance: 500,
            commonGroups: 0,
            matchingScore: 0.67,
            lastActive: new Date(Date.now() - 30 * 60 * 1000),
          },
        ];

        // 위치 기반 매칭 점수로 정렬
        return nearbyUsers
          .map(user => ({
            ...user,
            locationScore: get().calculateLocationMatchingScore(user.id, userLocation),
          }))
          .sort((a, b) => b.locationScore - a.locationScore);
      },

      /**
       * 위치 기반 매칭 점수 계산
       * @param {string} userId - 대상 사용자 ID
       * @param {Object} [userLocation] - 사용자 위치
       * @param {number} userLocation.latitude - 위도
       * @param {number} userLocation.longitude - 경도
       * @returns {number} 매칭 점수 (0-1)
       * @description 거리, 공통 그룹, 최근 활동 등을 고려한 점수 계산
       */
      calculateLocationMatchingScore: (userId, userLocation) => {
        if (!userLocation) return 0;

        // 기본 매칭 점수 (0-1)
        let score = 0.5;

        // TODO: 실제 사용자 데이터로 계산
        // 더미 계산
        const userDistance = Math.floor(Math.random() * 1000); // 0-1000m
        const commonGroups = Math.floor(Math.random() * 3); // 0-2개 공통 그룹
        const lastActiveMinutes = Math.floor(Math.random() * 60); // 0-60분 전 활동

        // 거리 가중치 (0.3)
        if (userDistance <= 200) {
          score += 0.3; // 200m 이내 최고 점수
        } else if (userDistance <= 500) {
          score += 0.2; // 500m 이내 중간 점수
        } else if (userDistance <= 1000) {
          score += 0.1; // 1km 이내 낮은 점수
        }

        // 공통 그룹 가중치 (0.2)
        if (commonGroups >= 2) {
          score += 0.2;
        } else if (commonGroups >= 1) {
          score += 0.1;
        }

        // 최근 활동 가중치 (0.1)
        if (lastActiveMinutes <= 10) {
          score += 0.1; // 10분 이내 활동
        } else if (lastActiveMinutes <= 30) {
          score += 0.05; // 30분 이내 활동
        }

        return Math.min(1.0, score); // 최대 1.0
      },

      /**
       * 일일 한도 리셋
       * @description 매일 자정에 좋아요와 슈퍼 좋아요 한도를 초기화
       */
      resetDailyLimits: () => {
        set({
          dailyLikesUsed: 0,
          superLikesUsed: 0, // 슈퍼 좋아요도 매일 리셋
          lastResetDate: new Date().toISOString().split('T')[0],
        });
      },

      /**
       * 일일 리셋 확인 및 실행
       * @description 날짜가 바뀌었는지 확인하고 필요시 리셋 실행
       */
      checkAndResetDaily: () => {
        const today = new Date().toISOString().split('T')[0];
        const lastReset = get().lastResetDate;
        
        if (today !== lastReset) {
          get().resetDailyLimits();
        }
      },
    }),
    {
      /** 저장소 키 이름 */
      name: 'like-storage',
      /** SecureStore를 사용하는 커스텀 저장소 */
      storage: createJSONStorage(() => secureStorage),
      /**
       * 영속화할 상태 선택
       * @description 일일 한도, 프리미엄 상태 등 민감하지 않은 데이터만 저장
       */
      partialize: (state) => ({
        dailyLikesUsed: state.dailyLikesUsed,
        superLikesUsed: state.superLikesUsed,
        dailySuperLikesLimit: state.dailySuperLikesLimit,
        lastResetDate: state.lastResetDate,
        hasPremium: state.hasPremium,
        premiumLikesRemaining: state.premiumLikesRemaining,
      }),
      /**
       * 저장소에서 데이터 복원 시 처리
       * @description Date 문자열을 Date 객체로 변환
       */
      onRehydrateStorage: () => (state) => {
        if (state) {
          // sentLikes의 createdAt을 Date 객체로 변환
          state.sentLikes = state.sentLikes?.map(like => ({
            ...like,
            createdAt: typeof like.createdAt === 'string' ? new Date(like.createdAt) : like.createdAt
          })) || [];
          
          // receivedLikes의 createdAt을 Date 객체로 변환
          state.receivedLikes = state.receivedLikes?.map(like => ({
            ...like,
            createdAt: typeof like.createdAt === 'string' ? new Date(like.createdAt) : like.createdAt
          })) || [];
          
          // matches의 createdAt을 Date 객체로 변환
          state.matches = state.matches?.map(match => ({
            ...match,
            createdAt: typeof match.createdAt === 'string' ? new Date(match.createdAt) : match.createdAt,
            lastMessageAt: match.lastMessageAt && typeof match.lastMessageAt === 'string' 
              ? new Date(match.lastMessageAt) 
              : match.lastMessageAt
          })) || [];
        }
      },
    }
  )
);