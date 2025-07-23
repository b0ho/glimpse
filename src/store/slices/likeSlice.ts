import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Like, Match } from '@/types';
import { LIKE_SYSTEM } from '@/utils/constants';

interface LikeState {
  // State
  sentLikes: Like[];
  receivedLikes: Like[];
  matches: Match[];
  
  // Daily limits
  dailyLikesUsed: number;
  lastResetDate: string; // ISO date string
  
  // Premium features
  hasPremium: boolean;
  premiumLikesRemaining: number;
  
  // Super Likes (Premium only)
  superLikesUsed: number;
  dailySuperLikesLimit: number; // 일일 슈퍼 좋아요 제한 (프리미엄 사용자만)
  
  // UI state
  isLoading: boolean;
  error: string | null;
}

interface LikeStore extends LikeState {
  // Actions
  sendLike: (toUserId: string, groupId: string) => Promise<boolean>;
  sendSuperLike: (toUserId: string, groupId: string) => Promise<boolean>; // 슈퍼 좋아요 전용
  createMatch: (match: Match) => void;
  setSentLikes: (likes: Like[]) => void;
  setReceivedLikes: (likes: Like[]) => void;
  setMatches: (matches: Match[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Premium actions
  purchasePremiumLikes: (count: number) => void;
  setPremiumStatus: (hasPremium: boolean) => void;
  syncWithPremiumStore: () => void;
  
  // Super Like actions
  canSendSuperLike: () => boolean;
  getRemainingSuperLikes: () => number;
  
  // Computed values
  canSendLike: (toUserId: string) => boolean;
  getRemainingFreeLikes: () => number;
  hasLikedUser: (userId: string) => boolean;
  isSuperLikedUser: (userId: string) => boolean;
  isMatchedWith: (userId: string) => boolean;
  getReceivedLikesCount: () => number;
  
  // Daily reset
  resetDailyLimits: () => void;
  checkAndResetDaily: () => void;
}

// SecureStore를 위한 커스텀 스토리지
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
  },
};

export const useLikeStore = create<LikeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      sentLikes: [],
      receivedLikes: [],
      matches: [],
      dailyLikesUsed: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
      hasPremium: false,
      premiumLikesRemaining: 0,
      superLikesUsed: 0,
      dailySuperLikesLimit: 3, // 프리미엄 사용자 일일 슈퍼 좋아요 3개
      isLoading: false,
      error: null,

      // Actions
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
            fromUserId: 'current_user_id', // 실제로는 현재 사용자 ID
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
            like => like.fromUserId === toUserId && like.toUserId === 'current_user_id'
          );

          if (receivedLikeFromSameUser) {
            // 매치 생성!
            const newMatch: Match = {
              id: `match_${Date.now()}`,
              user1Id: 'current_user_id',
              user2Id: toUserId,
              groupId,
              createdAt: new Date(),
              lastMessageAt: null,
              isActive: true,
            };

            state.createMatch(newMatch);

            // 새 매치 알림 전송
            if (typeof window !== 'undefined') {
              // 실제 사용자 이름 가져오기 (더미 데이터)
              const userName = `사용자${toUserId.slice(-4)}`;
              // notification service를 직접 사용
              import('../../services/notifications/notification-service').then(({ notificationService }) => {
                notificationService.notifyNewMatch(newMatch.id, userName);
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

      // 슈퍼 좋아요 전송 (프리미엄 전용)
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
            fromUserId: 'current_user_id', // 실제로는 현재 사용자 ID
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
            const userName = `사용자${toUserId.slice(-4)}`;
            import('../../services/notifications/notification-service').then(({ notificationService }) => {
              // 슈퍼 좋아요 전용 알림
              notificationService.notifySuperLikeReceived(newSuperLike.id, userName);
            });
          }

          // 매치 확인 (받은 좋아요가 있는지 확인)
          const receivedLikeFromSameUser = state.receivedLikes.find(
            like => like.fromUserId === toUserId && like.toUserId === 'current_user_id'
          );

          if (receivedLikeFromSameUser) {
            // 슈퍼 좋아요 매치 생성!
            const newMatch: Match = {
              id: `super_match_${Date.now()}`,
              user1Id: 'current_user_id',
              user2Id: toUserId,
              groupId,
              createdAt: new Date(),
              lastMessageAt: null,
              isActive: true,
            };

            state.createMatch(newMatch);

            // 슈퍼 매치 특별 알림
            if (typeof window !== 'undefined') {
              const userName = `사용자${toUserId.slice(-4)}`;
              import('../../services/notifications/notification-service').then(({ notificationService }) => {
                notificationService.notifySuperMatch(newMatch.id, userName);
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

      createMatch: (match: Match) => {
        set((state) => ({
          matches: [...state.matches, match],
        }));
      },

      setSentLikes: (likes: Like[]) => {
        set({ sentLikes: likes });
      },

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

      setMatches: (matches: Match[]) => {
        set({ matches });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      // Premium actions
      purchasePremiumLikes: (count: number) => {
        set((state) => ({
          premiumLikesRemaining: state.premiumLikesRemaining + count,
        }));
      },

      setPremiumStatus: (hasPremium: boolean) => {
        set({ hasPremium });
      },
      
      // Sync with premium store
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

      // Computed values
      canSendLike: (toUserId: string) => {
        const state = get();
        
        // 이미 좋아요를 보낸 사용자인지 확인
        const hasLiked = state.sentLikes.some((like) => like.toUserId === toUserId);
        if (hasLiked) return false;
        
        // 2주 쿨다운 확인
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - LIKE_SYSTEM.COOLDOWN_PERIOD_DAYS);
        
        const recentLike = state.sentLikes.find(
          (like) => like.toUserId === toUserId && like.createdAt > twoWeeksAgo
        );
        if (recentLike) return false;
        
        // 일일 한도 확인
        const remainingLikes = state.getRemainingFreeLikes();
        return remainingLikes > 0 || state.premiumLikesRemaining > 0;
      },

      getRemainingFreeLikes: () => {
        const state = get();
        return Math.max(0, LIKE_SYSTEM.DAILY_FREE_LIKES - state.dailyLikesUsed);
      },

      hasLikedUser: (userId: string) => {
        return get().sentLikes.some((like) => like.toUserId === userId && !like.isSuper);
      },

      isSuperLikedUser: (userId: string) => {
        return get().sentLikes.some((like) => like.toUserId === userId && like.isSuper);
      },

      // 슈퍼 좋아요 관련 computed values
      canSendSuperLike: () => {
        const state = get();
        
        // 프리미엄 사용자인지 확인
        if (!state.hasPremium) return false;
        
        // 일일 슈퍼 좋아요 한도 확인
        return state.superLikesUsed < state.dailySuperLikesLimit;
      },

      getRemainingSuperLikes: () => {
        const state = get();
        if (!state.hasPremium) return 0;
        return Math.max(0, state.dailySuperLikesLimit - state.superLikesUsed);
      },

      isMatchedWith: (userId: string) => {
        const state = get();
        return state.matches.some(
          (match) => match.user1Id === userId || match.user2Id === userId
        );
      },

      getReceivedLikesCount: () => {
        return get().receivedLikes.length;
      },

      // Daily reset
      resetDailyLimits: () => {
        set({
          dailyLikesUsed: 0,
          superLikesUsed: 0, // 슈퍼 좋아요도 매일 리셋
          lastResetDate: new Date().toISOString().split('T')[0],
        });
      },

      checkAndResetDaily: () => {
        const today = new Date().toISOString().split('T')[0];
        const lastReset = get().lastResetDate;
        
        if (today !== lastReset) {
          get().resetDailyLimits();
        }
      },
    }),
    {
      name: 'like-storage',
      storage: createJSONStorage(() => secureStorage),
      // 민감하지 않은 데이터만 persist
      partialize: (state) => ({
        dailyLikesUsed: state.dailyLikesUsed,
        superLikesUsed: state.superLikesUsed, // 슈퍼 좋아요 사용량 persist
        dailySuperLikesLimit: state.dailySuperLikesLimit,
        lastResetDate: state.lastResetDate,
        hasPremium: state.hasPremium,
        premiumLikesRemaining: state.premiumLikesRemaining,
      }),
    }
  )
);