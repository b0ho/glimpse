import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/services/api/config';
import {
  InterestSearch,
  InterestMatch,
  CreateInterestSearchDto,
  UpdateInterestSearchDto,
  GetInterestSearchesQuery,
  // ApiResponse,
  CheckMatchDto,
  InterestType,
} from '@/types/interest';
import { PremiumLevel } from '@/shared/types';
import { useAuthStore } from './authSlice';

interface InterestState {
  searches: InterestSearch[];
  matches: InterestMatch[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchSearches: (query?: GetInterestSearchesQuery) => Promise<void>;
  fetchMatches: () => Promise<void>;
  createSearch: (dto: CreateInterestSearchDto) => Promise<InterestSearch>;
  updateSearch: (id: string, dto: UpdateInterestSearchDto) => Promise<InterestSearch>;
  deleteSearch: (id: string) => Promise<void>;
  checkMatch: (dto: CheckMatchDto) => Promise<InterestMatch | null>;
  clearError: () => void;
  reset: () => void;
  
  // Helper functions
  getSearchLimitByType: (type: InterestType, premiumLevel: PremiumLevel) => number;
  getExpirationDate: (premiumLevel: PremiumLevel) => Date | null;
  canRegisterInterest: (type: InterestType, premiumLevel: PremiumLevel) => boolean;
}

const initialState = {
  searches: [],
  matches: [],
  loading: false,
  error: null,
};

/**
 * 관심상대 찾기 상태 관리 스토어
 */
export const useInterestStore = create<InterestState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * 내 관심상대 검색 목록 조회
       */
      fetchSearches: async (query?: GetInterestSearchesQuery) => {
        set({ loading: true, error: null });
        try {

          const params = new URLSearchParams();
          if (query?.type) params.append('type', query.type);
          if (query?.status) params.append('status', query.status);

          const response = await apiClient.get(
            `/interest/searches${params.toString() ? `?${params.toString()}` : ''}`
          );

          console.log('[interestSlice] fetchSearches response:', response);

          // API 응답 형식 체크
          if (Array.isArray(response)) {
            console.log('[interestSlice] Response is array, setting searches:', response);
            set({ searches: response, loading: false });
          } else if (response && (response as any).success) {
            set({ searches: (response as any).data || [], loading: false });
          } else if (response && (response as any).data) {
            set({ searches: (response as any).data, loading: false });
          } else {
            console.warn('Unexpected response format:', response);
            set({ searches: [], loading: false });
          }
        } catch (error: any) {
          console.error('[interestSlice] Failed to fetch searches:', error);
          // 에러를 state에 저장하지 않고 빈 배열로 처리
          set({
            searches: [],
            loading: false,
            error: null,
          });
        }
      },

      /**
       * 매칭된 목록 조회
       */
      fetchMatches: async () => {
        set({ loading: true, error: null });
        try {

          const response = await apiClient.get('/interest/matches');

          console.log('[interestSlice] fetchMatches response:', response);

          // API 응답 형식 체크
          if (Array.isArray(response)) {
            console.log('[interestSlice] Response is array, setting matches:', response);
            set({ matches: response, loading: false });
          } else if (response && (response as any).success) {
            set({ matches: (response as any).data || [], loading: false });
          } else if (response && (response as any).data) {
            set({ matches: (response as any).data, loading: false });
          } else {
            console.warn('Unexpected matches response format:', response);
            set({ matches: [], loading: false });
          }
        } catch (error: any) {
          console.error('[interestSlice] Failed to fetch matches:', error);
          // 에러를 state에 저장하지 않고 빈 배열로 처리
          set({
            matches: [],
            loading: false,
            error: null,
          });
        }
      },

      /**
       * 프리미엄 레벨별 유형당 검색 제한 개수 반환
       */
      getSearchLimitByType: (type: InterestType, premiumLevel: PremiumLevel): number => {
        switch (premiumLevel) {
          case PremiumLevel.FREE:
            return 1; // 무료: 유형별 1개
          case PremiumLevel.BASIC:
            return 3; // 베이직: 유형별 3개
          case PremiumLevel.UPPER:
            return 999; // 상위: 제한 없음 (실질적으로 무제한)
          default:
            return 1;
        }
      },

      /**
       * 프리미엄 레벨별 검색 유효기간 계산
       */
      getExpirationDate: (premiumLevel: PremiumLevel): Date | null => {
        const now = new Date();
        switch (premiumLevel) {
          case PremiumLevel.FREE:
            // 무료: 1주일
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          case PremiumLevel.BASIC:
            // 베이직: 1개월
            return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          case PremiumLevel.UPPER:
            // 상위: 제한 없음
            return null;
          default:
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
      },

      /**
       * 특정 유형의 관심상대를 등록할 수 있는지 확인
       */
      canRegisterInterest: (type: InterestType, premiumLevel: PremiumLevel): boolean => {
        const state = get();
        const activeSearches = state.searches.filter(
          (s) => s.type === type && s.status === 'ACTIVE'
        );
        const limit = state.getSearchLimitByType(type, premiumLevel);
        return activeSearches.length < limit;
      },

      /**
       * 관심상대 검색 등록
       */
      createSearch: async (dto: CreateInterestSearchDto) => {
        set({ loading: true, error: null });
        try {
          // 사용자 정보 가져오기
          const user = useAuthStore.getState().user;
          const premiumLevel = user?.premiumLevel || PremiumLevel.FREE;
          
          // 등록 가능 여부 확인
          if (!get().canRegisterInterest(dto.type, premiumLevel)) {
            const limit = get().getSearchLimitByType(dto.type, premiumLevel);
            const errorMessage = premiumLevel === PremiumLevel.FREE 
              ? `무료 사용자는 ${dto.type} 유형으로 최대 ${limit}개까지만 등록 가능합니다. 프리미엄 업그레이드를 통해 더 많은 관심상대를 등록하세요.`
              : `현재 프리미엄 레벨에서는 ${dto.type} 유형으로 최대 ${limit}개까지만 등록 가능합니다.`;
            set({ error: errorMessage, loading: false });
            throw new Error(errorMessage);
          }
          
          // 유효기간 설정
          const expirationDate = get().getExpirationDate(premiumLevel);
          if (expirationDate && !dto.expiresAt) {
            dto.expiresAt = expirationDate.toISOString();
          }

          const response = await apiClient.post('/interest/search', dto);

          if ((response as any).success) {
            const newSearch = (response as any).data;
            set((state) => ({
              searches: [newSearch, ...state.searches],
              loading: false,
            }));
            return newSearch;
          } else {
            throw new Error((response as any).message || '검색 등록에 실패했습니다');
          }
        } catch (error: any) {
          console.error('Failed to create search:', error);
          const errorMessage = error.response?.data?.message || error.message || '검색 등록 실패';
          set({ error: errorMessage, loading: false });
          throw new Error(errorMessage);
        }
      },

      /**
       * 관심상대 검색 업데이트
       */
      updateSearch: async (id: string, dto: UpdateInterestSearchDto) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.put(`/interest/searches/${id}`, dto);

          if ((response as any).success) {
            const updatedSearch = (response as any).data;
            set((state) => ({
              searches: state.searches.map((s) => (s.id === id ? updatedSearch : s)),
              loading: false,
            }));
            return updatedSearch;
          } else {
            throw new Error((response as any).message || '검색 업데이트에 실패했습니다');
          }
        } catch (error: any) {
          console.error('Failed to update search:', error);
          const errorMessage = error.response?.data?.message || error.message || '검색 업데이트 실패';
          set({ error: errorMessage, loading: false });
          throw new Error(errorMessage);
        }
      },

      /**
       * 관심상대 검색 삭제
       */
      deleteSearch: async (id: string) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.delete(`/interest/searches/${id}`);

          if ((response as any).success || (response as any).status === 204) {
            set((state) => ({
              searches: state.searches.filter((s) => s.id !== id),
              loading: false,
            }));
          } else {
            throw new Error((response as any).message || '검색 삭제에 실패했습니다');
          }
        } catch (error: any) {
          console.error('Failed to delete search:', error);
          set({
            error: error.response?.data?.message || error.message || '검색 삭제 실패',
            loading: false,
          });
        }
      },

      /**
       * 즉시 매칭 확인
       */
      checkMatch: async (dto: CheckMatchDto) => {
        set({ loading: true, error: null });
        try {

          const response = await apiClient.post('/interest/check-match', dto);

          if ((response as any).success) {
            const match = (response as any).data;
            if (match) {
              // 매칭이 발견되면 목록에 추가
              set((state) => ({
                matches: [match, ...state.matches],
                loading: false,
              }));
              
              // 검색 목록도 업데이트 (매칭 상태로 변경)
              await get().fetchSearches();
            } else {
              set({ loading: false });
            }
            return match;
          } else {
            throw new Error((response as any).message || '매칭 확인에 실패했습니다');
          }
        } catch (error: any) {
          console.error('Failed to check match:', error);
          set({
            error: error.response?.data?.message || error.message || '매칭 확인 실패',
            loading: false,
          });
          return null;
        }
      },

      /**
       * 에러 초기화
       */
      clearError: () => set({ error: null }),

      /**
       * 상태 초기화
       */
      reset: () => set(initialState),
    }),
    {
      name: 'interest-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        searches: state.searches,
        matches: state.matches,
      }),
    }
  )
);