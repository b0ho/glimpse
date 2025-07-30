import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Like, Match } from '@/types';
import { LIKE_SYSTEM } from '@/utils/constants';
import { useAuthStore } from './authSlice';

// Import types
import { LikeState, LikeStore } from './like/types';

// Import utilities
import {
  isToday,
  getTodayDateString,
  canUserSendLike,
  canSendSuperLike,
  canRewind,
} from './like/utils';

// Import actions
import {
  sendLikeAction,
  rewindLikeAction,
  resetDailyLimitsAction,
  purchasePremiumLikesAction,
} from './like/actions';

// Import selectors
import {
  hasLikedUserSelector,
  isSuperLikedUserSelector,
  isMatchedWithSelector,
  getReceivedLikesCountSelector,
  getRemainingFreeLikesSelector,
  getRemainingSuperLikesSelector,
  getAnonymousUserInfoSelector,
  getUserDisplayNameSelector,
  getLocationBasedMatchesSelector,
  calculateLocationMatchingScoreSelector,
  getLastLikeSelector,
} from './like/selectors';

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

const initialState: LikeState = {
  sentLikes: [],
  receivedLikes: [],
  matches: [],
  dailyLikesUsed: 0,
  lastResetDate: getTodayDateString(),
  hasPremium: false,
  premiumLikesRemaining: 0,
  superLikesUsed: 0,
  dailySuperLikesLimit: LIKE_SYSTEM.DAILY_SUPER_LIKES_PREMIUM,
  isLoading: false,
  error: null,
};

export const useLikeStore = create<LikeStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Actions
      sendLike: async (toUserId: string, groupId: string) => {
        const state = get();
        
        // Check daily reset
        get().checkAndResetDaily();
        
        set({ isLoading: true, error: null });
        
        const result = await sendLikeAction(state, toUserId, groupId, false);
        
        if (result.success && result.updatedState) {
          set({ ...result.updatedState, isLoading: false });
          return true;
        } else {
          set({ isLoading: false, error: result.error || null });
          return false;
        }
      },

      sendSuperLike: async (toUserId: string, groupId: string) => {
        const state = get();
        
        // Check if can send super like
        if (!get().canSendSuperLike()) {
          set({ error: '슈퍼 좋아요를 더 이상 보낼 수 없습니다.' });
          return false;
        }
        
        set({ isLoading: true, error: null });
        
        const result = await sendLikeAction(state, toUserId, groupId, true);
        
        if (result.success && result.updatedState) {
          set({ ...result.updatedState, isLoading: false });
          return true;
        } else {
          set({ isLoading: false, error: result.error || null });
          return false;
        }
      },

      createMatch: (match: Match) => {
        set((state) => ({
          matches: [...state.matches, match],
        }));
      },

      setSentLikes: (likes: Like[]) => set({ sentLikes: likes }),
      setReceivedLikes: (likes: Like[]) => set({ receivedLikes: likes }),
      setMatches: (matches: Match[]) => set({ matches }),
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),

      // Premium actions
      purchasePremiumLikes: (count: number) => {
        const updatedState = purchasePremiumLikesAction(get(), count);
        set(updatedState);
      },

      setPremiumStatus: (hasPremium: boolean) => {
        set({ hasPremium });
        if (hasPremium) {
          // Reset super likes limit for premium users
          set({ dailySuperLikesLimit: LIKE_SYSTEM.DAILY_SUPER_LIKES_PREMIUM });
        } else {
          set({ dailySuperLikesLimit: 0 });
        }
      },

      syncWithPremiumStore: () => {
        // Sync with premium store from authSlice
        const user = useAuthStore.getState().user;
        if (user) {
          set({ hasPremium: user.isPremium });
        }
      },

      // Super Like actions
      canSendSuperLike: () => {
        const state = get();
        return canSendSuperLike(
          state.hasPremium,
          state.superLikesUsed,
          state.dailySuperLikesLimit
        );
      },

      getRemainingSuperLikes: () => {
        const state = get();
        return getRemainingSuperLikesSelector(state);
      },

      // Rewind actions
      canRewindLike: () => {
        const state = get();
        return canRewind(state.hasPremium, state.sentLikes);
      },

      rewindLastLike: async () => {
        const state = get();
        
        if (!get().canRewindLike()) {
          set({ error: '되돌릴 수 없습니다.' });
          return false;
        }
        
        set({ isLoading: true, error: null });
        
        const result = await rewindLikeAction(state);
        
        if (result.success && result.updatedState) {
          set({ ...result.updatedState, isLoading: false });
          return true;
        } else {
          set({ isLoading: false, error: result.error || null });
          return false;
        }
      },

      getLastLike: () => {
        const state = get();
        return getLastLikeSelector(state);
      },

      // Computed values
      canSendLike: (toUserId: string) => {
        const state = get();
        return canUserSendLike(
          toUserId,
          state.sentLikes,
          state.dailyLikesUsed,
          state.hasPremium,
          state.premiumLikesRemaining
        );
      },

      getRemainingFreeLikes: () => {
        const state = get();
        return getRemainingFreeLikesSelector(state);
      },

      hasLikedUser: (userId: string) => {
        const state = get();
        return hasLikedUserSelector(state, userId);
      },

      isSuperLikedUser: (userId: string) => {
        const state = get();
        return isSuperLikedUserSelector(state, userId);
      },

      isMatchedWith: (userId: string) => {
        const state = get();
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return false;
        return isMatchedWithSelector(state, userId, currentUser.id);
      },

      getReceivedLikesCount: () => {
        const state = get();
        return getReceivedLikesCountSelector(state);
      },

      // Anonymity system
      getAnonymousUserInfo: (userId: string, currentUserId: string) => {
        const state = get();
        return getAnonymousUserInfoSelector(state, userId, currentUserId);
      },

      getUserDisplayName: (userId: string, currentUserId: string) => {
        const state = get();
        return getUserDisplayNameSelector(state, userId, currentUserId);
      },

      // Location-based matching
      getLocationBasedMatches: (userLocation) => {
        const state = get();
        // This would need to be integrated with actual user data
        // For now, returning empty array
        return getLocationBasedMatchesSelector(state, userLocation, []);
      },

      calculateLocationMatchingScore: (userId, userLocation) => {
        // This would need to be integrated with actual user data
        // For now, returning 0
        return calculateLocationMatchingScoreSelector(
          userId,
          userLocation,
          undefined
        );
      },

      // Daily reset
      resetDailyLimits: () => {
        const updatedState = resetDailyLimitsAction(get());
        set(updatedState);
      },

      checkAndResetDaily: () => {
        const state = get();
        if (!isToday(state.lastResetDate)) {
          get().resetDailyLimits();
        }
      },
    }),
    {
      name: 'like-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        sentLikes: state.sentLikes,
        receivedLikes: state.receivedLikes,
        matches: state.matches,
        dailyLikesUsed: state.dailyLikesUsed,
        lastResetDate: state.lastResetDate,
        premiumLikesRemaining: state.premiumLikesRemaining,
        superLikesUsed: state.superLikesUsed,
      }),
    }
  )
);