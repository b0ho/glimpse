import { create, persist, createJSONStorage } from '../zustandCompat';
import { secureStorage } from '@/utils/storage';
import { Like, Match } from '@/types';
import { LIKE_SYSTEM } from '@/utils/constants';
import { useAuthStore } from './authSlice';
import { SubscriptionTier, SUBSCRIPTION_FEATURES } from '@/types/subscription';
import { LikeState, LikeStore } from '../types/likeTypes';
import { likeCalculations } from '../utils/likeCalculations';
import { likeApi } from '@/services/api/likeApi';
import apiClient from '@/services/api/config';

/**
 * SecureStorage 어댑터 설정
 */
const secureStorageAdapter = {
  getItem: async (name: string) => {
    try {
      const value = await secureStorage.getItem(name);
      return value || null;
    } catch (error) {
      console.error('Failed to get item from secure storage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      await secureStorage.setItem(name, value);
    } catch (error) {
      console.error('Failed to set item in secure storage:', error);
    }
  },
  removeItem: async (name: string) => {
    try {
      await secureStorage.removeItem(name);
    } catch (error) {
      console.error('Failed to remove item from secure storage:', error);
    }
  },
};

/**
 * 좋아요 스토어
 * @description 좋아요 시스템 전체 상태와 액션 관리
 */
export const useLikeStore = create<LikeStore>()(
  persist(
    (set, get) => ({
      // Initial State
      sentLikes: [],
      receivedLikes: [],
      matches: [],
      dailyLikesUsed: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
      hasPremium: false,
      premiumLikesRemaining: 0,
      superLikesUsed: 0,
      dailySuperLikesLimit: 0,
      isLoading: false,
      error: null,

      // Basic Actions
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setSentLikes: (sentLikes) => set({ sentLikes }),
      setReceivedLikes: (receivedLikes) => set({ receivedLikes }),
      setMatches: (matches) => set({ matches }),
      createMatch: (match) => set((state) => ({ 
        matches: [...(state.matches || []), match] 
      })),
      
      // Like Calculation Actions
      canLike: () => {
        const state = get();
        return likeCalculations.canLike(state);
      },

      getRemainingFreeLikes: () => {
        const state = get();
        return likeCalculations.getRemainingFreeLikes(state);
      },

      getTotalRemainingLikes: () => {
        const state = get();
        return likeCalculations.getTotalRemainingLikes(state);
      },

      hasLiked: (userId) => {
        return get().sentLikes.some((like) => like.toUserId === userId);
      },

      // Super Like Actions
      canSendSuperLike: () => {
        const state = get();
        return likeCalculations.canSendSuperLike(state);
      },

      getRemainingSuperLikes: () => {
        const state = get();
        return likeCalculations.getRemainingSuperLikes(state);
      },

      // Rewind Actions
      canRewindLike: () => {
        const state = get();
        return likeCalculations.canRewindLike(state);
      },

      // Send Like Action
      sendLike: async (toUserId, groupId) => {
        set({ isLoading: true, error: null });
        try {
          const state = get();
          const authState = useAuthStore.getState();
          const currentUserId = authState.user?.id;

          if (!currentUserId) {
            throw new Error('사용자 인증이 필요합니다.');
          }

          // 좋아요 가능 여부 확인
          if (!state.canLike()) {
            throw new Error('일일 좋아요 한도를 초과했습니다.');
          }

          // 이미 좋아요를 보냈는지 확인
          if (state.hasLiked(toUserId)) {
            throw new Error('이미 좋아요를 보낸 사용자입니다.');
          }

          // API 호출
          const response = await likeApi.sendLike(toUserId, groupId, false);

          // 새 좋아요 생성
          const newLike: Like = {
            id: response.likeId,
            fromUserId: currentUserId,
            toUserId,
            groupId,
            isSuper: false,
            createdAt: new Date().toISOString(),
            isRead: false,
          };

          // 상태 업데이트
          set((state) => ({
            sentLikes: [...state.sentLikes, newLike],
            dailyLikesUsed: state.hasPremium ? state.dailyLikesUsed : state.dailyLikesUsed + 1,
            premiumLikesRemaining: state.hasPremium ? state.premiumLikesRemaining : Math.max(0, state.premiumLikesRemaining - 1),
            isLoading: false,
          }));

          // 매치 확인
          if (response.isMatch && response.matchId) {
            const newMatch: Match = {
              id: response.matchId,
              user1Id: currentUserId,
              user2Id: toUserId,
              groupId,
              createdAt: new Date().toISOString(),
              lastMessage: null,
              lastMessageAt: null,
            };
            get().createMatch(newMatch);
          }

          return true;
        } catch (error) {
          console.error('Send like error:', error);
          set({ 
            error: error instanceof Error ? error.message : '좋아요 전송에 실패했습니다.',
            isLoading: false,
          });
          return false;
        }
      },

      // Send Super Like Action
      sendSuperLike: async (toUserId, groupId) => {
        set({ isLoading: true, error: null });
        try {
          const state = get();
          
          if (!state.canSendSuperLike()) {
            throw new Error('슈퍼 좋아요 한도를 초과했습니다.');
          }

          const response = await likeApi.sendLike(toUserId, groupId, true);
          
          // 슈퍼 좋아요 상태 업데이트
          set((state) => ({
            superLikesUsed: state.superLikesUsed + 1,
            isLoading: false,
          }));

          return true;
        } catch (error) {
          console.error('Send super like error:', error);
          set({ 
            error: error instanceof Error ? error.message : '슈퍼 좋아요 전송에 실패했습니다.',
            isLoading: false,
          });
          return false;
        }
      },

      // Cancel Like Action
      cancelLike: async (likeId) => {
        try {
          await apiClient.delete(`/likes/${likeId}`);
          set((state) => ({
            sentLikes: state.sentLikes.filter(like => like.id !== likeId),
            dailyLikesUsed: Math.max(0, state.dailyLikesUsed - 1),
          }));
          return true;
        } catch (error) {
          console.error('Cancel like error:', error);
          return false;
        }
      },

      // Delete Like History Action
      deleteLikeHistory: async (likeIds) => {
        try {
          await apiClient.post('/likes/delete-history', { likeIds });
          set((state) => ({
            sentLikes: state.sentLikes.filter(like => !likeIds.includes(like.id)),
          }));
          return true;
        } catch (error) {
          console.error('Delete like history error:', error);
          return false;
        }
      },

      // Refresh Likes Action
      refreshLikes: async () => {
        try {
          const authState = useAuthStore.getState();
          const userId = authState.user?.id;
          
          if (!userId) return;

          const [sent, received] = await Promise.all([
            likeApi.getSentLikes(),
            likeApi.getReceivedLikes(),
          ]);

          set({
            sentLikes: sent,
            receivedLikes: received,
          });
        } catch (error) {
          console.error('Refresh likes error:', error);
        }
      },

      // Premium Actions
      purchasePremiumLikes: (count) => {
        set((state) => ({
          premiumLikesRemaining: state.premiumLikesRemaining + count,
        }));
      },

      setPremiumStatus: (hasPremium) => {
        set({ 
          hasPremium,
          dailySuperLikesLimit: hasPremium ? SUBSCRIPTION_FEATURES.premium.superLikes : 0,
        });
      },

      syncWithPremiumStore: () => {
        // TODO: Sync with premium store
        const hasPremium = false; // Get from premium store
        get().setPremiumStatus(hasPremium);
      },

      // Rewind Last Like Action
      rewindLastLike: async () => {
        try {
          const state = get();
          if (!state.canRewindLike()) {
            return false;
          }

          const lastLike = state.sentLikes[state.sentLikes.length - 1];
          if (!lastLike) {
            return false;
          }

          await apiClient.post(`/likes/${lastLike.id}/rewind`);
          
          set((state) => ({
            sentLikes: state.sentLikes.slice(0, -1),
            dailyLikesUsed: Math.max(0, state.dailyLikesUsed - 1),
          }));

          return true;
        } catch (error) {
          console.error('Rewind like error:', error);
          return false;
        }
      },

      // Daily Limits Actions
      resetDailyLimits: () => {
        set({
          dailyLikesUsed: 0,
          superLikesUsed: 0,
          lastResetDate: new Date().toISOString().split('T')[0],
        });
      },

      checkDailyLimits: () => {
        const state = get();
        const shouldReset = likeCalculations.checkDailyLimits(state.lastResetDate);
        
        if (shouldReset) {
          get().resetDailyLimits();
        }
      },

      // Mark Like as Read Action
      markReceivedLikeAsRead: async (likeId) => {
        try {
          await apiClient.post(`/likes/${likeId}/read`);
          set((state) => ({
            receivedLikes: state.receivedLikes.map((like) =>
              like.id === likeId ? { ...like, isRead: true } : like
            ),
          }));
        } catch (error) {
          console.error('Mark like as read error:', error);
        }
      },

      // Unmatch Action
      unmatch: async (matchId) => {
        try {
          await apiClient.delete(`/matches/${matchId}`);
          set((state) => ({
            matches: (state.matches || []).filter(match => match.id !== matchId),
          }));
          return true;
        } catch (error) {
          console.error('Unmatch error:', error);
          return false;
        }
      },

      // Match Helper Actions
      isMatchedWith: (userId) => {
        const state = get();
        // matches가 undefined거나 null인 경우 빈 배열로 처리
        if (!state.matches || !Array.isArray(state.matches)) {
          return false;
        }
        return state.matches.some(
          (match) => match.user1Id === userId || match.user2Id === userId
        );
      },

      getReceivedLikesCount: () => {
        return get().receivedLikes.length;
      },

      // Anonymous User Info Actions
      getAnonymousUserInfo: (userId, currentUserId) => {
        const state = get();
        const isMatched = state.isMatchedWith(userId);

        // 기본 익명 정보 반환
        return {
          id: userId,
          anonymousId: `anon_${userId}`,
          displayName: isMatched ? 'Matched User' : 'Anonymous User',
          nickname: 'Anonymous User',
          realName: isMatched ? 'Matched User' : undefined,
          isMatched,
          gender: 'OTHER' as const,
        };
      },

      getUserDisplayName: (userId, currentUserId) => {
        const anonymousInfo = get().getAnonymousUserInfo(userId, currentUserId);
        if (!anonymousInfo?.displayName) {
          return likeCalculations.generateAnonymousName(userId);
        }
        return anonymousInfo.displayName;
      },

      // Location Based Matching Actions
      getLocationBasedMatches: (userLocation) => {
        if (!userLocation) return [];

        // TODO: Get from API
        const nearbyUsers = [
          {
            id: 'nearby_1',
            nickname: '커피러버',
            distance: 150,
            commonGroups: 1,
            matchingScore: 0.85,
            lastActive: new Date(),
          },
        ];

        return nearbyUsers.map(user => ({
          ...user,
          locationScore: likeCalculations.calculateLocationMatchingScore(
            user.distance,
            user.commonGroups,
            0
          ),
        }));
      },

      calculateLocationMatchingScore: (userId, userLocation) => {
        if (!userLocation) return 0;
        
        // TODO: Get actual user data
        const userDistance = Math.floor(Math.random() * 1000);
        const commonGroups = Math.floor(Math.random() * 3);
        const lastActiveMinutes = Math.floor(Math.random() * 60);
        
        return likeCalculations.calculateLocationMatchingScore(
          userDistance,
          commonGroups,
          lastActiveMinutes
        );
      },

      // Clear Action
      clear: () => {
        set({
          sentLikes: [],
          receivedLikes: [],
          matches: [],
          dailyLikesUsed: 0,
          lastResetDate: new Date().toISOString().split('T')[0],
          hasPremium: false,
          premiumLikesRemaining: 0,
          superLikesUsed: 0,
          dailySuperLikesLimit: 0,
          isLoading: false,
          error: null,
        });
      },
      
      // Clear Likes - alias for clear (로그아웃 시 사용)
      clearLikes: () => {
        set({
          sentLikes: [],
          receivedLikes: [],
          matches: [],
          dailyLikesUsed: 0,
          lastResetDate: new Date().toISOString().split('T')[0],
          hasPremium: false,
          premiumLikesRemaining: 0,
          superLikesUsed: 0,
          dailySuperLikesLimit: 0,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'like-store',
      storage: createJSONStorage(() => secureStorageAdapter),
      partialize: (state) => ({
        sentLikes: state.sentLikes || [],
        receivedLikes: state.receivedLikes || [],
        matches: state.matches || [],
        dailyLikesUsed: state.dailyLikesUsed || 0,
        lastResetDate: state.lastResetDate,
        premiumLikesRemaining: state.premiumLikesRemaining || 0,
        superLikesUsed: state.superLikesUsed || 0,
      }),
    }
  )
);