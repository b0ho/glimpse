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
  
  // UI state
  isLoading: boolean;
  error: string | null;
}

interface LikeStore extends LikeState {
  // Actions
  sendLike: (toUserId: string, groupId: string) => Promise<boolean>;
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
  
  // Computed values
  canSendLike: (toUserId: string) => boolean;
  getRemainingFreeLikes: () => number;
  hasLikedUser: (userId: string) => boolean;
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
            createdAt: new Date(),
          };
          
          // 상태 업데이트
          set((state) => ({
            sentLikes: [...state.sentLikes, newLike],
            dailyLikesUsed: state.dailyLikesUsed + 1,
            isLoading: false,
          }));
          
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

      createMatch: (match: Match) => {
        set((state) => ({
          matches: [...state.matches, match],
        }));
      },

      setSentLikes: (likes: Like[]) => {
        set({ sentLikes: likes });
      },

      setReceivedLikes: (likes: Like[]) => {
        set({ receivedLikes: likes });
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
        return get().sentLikes.some((like) => like.toUserId === userId);
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
        lastResetDate: state.lastResetDate,
        hasPremium: state.hasPremium,
        premiumLikesRemaining: state.premiumLikesRemaining,
      }),
    }
  )
);