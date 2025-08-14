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
  CheckMatchDto,
  InterestType,
} from '@/types/interest';

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
          // 개발 환경에서는 Mock 데이터 사용
          if (__DEV__) {
            const storedSearches = await AsyncStorage.getItem('interest-searches');
            const searches = storedSearches ? JSON.parse(storedSearches) : [];
            
            // 필터링 적용
            let filteredSearches = searches;
            if (query?.type) {
              filteredSearches = filteredSearches.filter((s: InterestSearch) => s.type === query.type);
            }
            if (query?.status) {
              filteredSearches = filteredSearches.filter((s: InterestSearch) => s.status === query.status);
            }
            
            set({ searches: filteredSearches, loading: false });
            console.log('[InterestStore] Mock 검색 목록 조회:', filteredSearches.length, '개');
            
            // 테스트용: 첫 번째 검색이 있고 매칭이 없으면 자동 매칭 생성
            if (filteredSearches.length > 0) {
              const existingMatches = await AsyncStorage.getItem('interest-matches');
              const matches = existingMatches ? JSON.parse(existingMatches) : [];
              
              if (matches.length === 0 && Math.random() > 0.3) {
                console.log('[InterestStore] 테스트용 자동 매칭 생성');
                const firstSearch = filteredSearches[0];
                const mockMatch: InterestMatch = {
                  id: `match_${Date.now()}`,
                  searchId: firstSearch.id,
                  matchedUserId: `user_${Math.floor(Math.random() * 10) + 1}`,
                  matchedUser: {
                    id: `user_${Math.floor(Math.random() * 10) + 1}`,
                    nickname: ['책벌레', '영화광', '음악애호가', '산책매니아'][Math.floor(Math.random() * 4)],
                    profileImage: `https://picsum.photos/200/200?random=${Date.now()}`,
                  },
                  matchType: firstSearch.type || InterestType.EMAIL,
                  matchValue: firstSearch.value || 'test@example.com',
                  matchedAt: new Date().toISOString(),
                  status: 'ACTIVE',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                
                matches.unshift(mockMatch);
                await AsyncStorage.setItem('interest-matches', JSON.stringify(matches));
                console.log('[InterestStore] 테스트 매칭 생성 완료:', mockMatch);
              }
            }
            
            return;
          }

          const params = new URLSearchParams();
          if (query?.type) params.append('type', query.type);
          if (query?.status) params.append('status', query.status);

          const response = await apiClient.get(
            `/interest/searches${params.toString() ? `?${params.toString()}` : ''}`
          );

          if (response.data.success) {
            set({ searches: response.data.data, loading: false });
          } else {
            throw new Error(response.data.message || '검색 목록을 불러오는데 실패했습니다');
          }
        } catch (error: any) {
          console.error('Failed to fetch searches:', error);
          set({
            error: error.response?.data?.message || error.message || '검색 목록 조회 실패',
            loading: false,
          });
        }
      },

      /**
       * 매칭된 목록 조회
       */
      fetchMatches: async () => {
        set({ loading: true, error: null });
        try {
          // 개발 환경에서는 Mock 데이터 사용
          if (__DEV__) {
            const storedMatches = await AsyncStorage.getItem('interest-matches');
            let matches = storedMatches ? JSON.parse(storedMatches) : [];
            
            // 테스트용: 매칭이 없으면 하나 자동 생성
            if (matches.length === 0) {
              console.log('[InterestStore] 테스트용 매칭 데이터 생성');
              // 다양한 타입 테스트를 위한 랜덤 타입 선택
              const testTypes = [
                { type: InterestType.EMAIL, value: 'test@example.com' },
                { type: InterestType.SOCIAL_ID, value: '@testuser' },
                { type: InterestType.PHONE, value: '010-1234-5678' },
                { type: InterestType.NICKNAME, value: '책벌레' },
              ];
              const randomType = testTypes[Math.floor(Math.random() * testTypes.length)];
              
              const testMatch: InterestMatch = {
                id: `match_test_${Date.now()}`,
                searchId: `search_test_${Date.now()}`,
                matchedUserId: `user_test`,
                matchedUser: {
                  id: `user_test`,
                  nickname: '책벌레',
                  profileImage: `https://picsum.photos/200/200?random=${Date.now()}`,
                },
                matchType: randomType.type,
                matchValue: randomType.value,
                matchedAt: new Date().toISOString(),
                status: 'ACTIVE',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              matches = [testMatch];
              await AsyncStorage.setItem('interest-matches', JSON.stringify(matches));
            }
            
            set({ matches, loading: false });
            console.log('[InterestStore] Mock 매칭 목록 조회:', matches.length, '개');
            return;
          }

          const response = await apiClient.get('/interest/matches');

          if (response.data.success) {
            set({ matches: response.data.data, loading: false });
          } else {
            throw new Error(response.data.message || '매칭 목록을 불러오는데 실패했습니다');
          }
        } catch (error: any) {
          console.error('Failed to fetch matches:', error);
          set({
            error: error.response?.data?.message || error.message || '매칭 목록 조회 실패',
            loading: false,
          });
        }
      },

      /**
       * 관심상대 검색 등록
       */
      createSearch: async (dto: CreateInterestSearchDto) => {
        set({ loading: true, error: null });
        try {
          // 개발 환경에서는 Mock 데이터 사용
          if (__DEV__) {
            // Mock 데이터 생성
            const mockSearch: InterestSearch = {
              id: `search_${Date.now()}`,
              userId: 'current_user',
              type: dto.type,
              value: dto.value,
              metadata: dto.metadata || {},
              status: 'ACTIVE',
              matchedWithId: null,
              matchedAt: null,
              expiresAt: dto.expiresAt || null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            // AsyncStorage에 저장
            const existingSearches = await AsyncStorage.getItem('interest-searches');
            const searches = existingSearches ? JSON.parse(existingSearches) : [];
            searches.unshift(mockSearch);
            await AsyncStorage.setItem('interest-searches', JSON.stringify(searches));

            set((state) => ({
              searches: [mockSearch, ...state.searches],
              loading: false,
            }));
            
            console.log('[InterestStore] Mock 검색 등록 성공:', mockSearch);
            
            // 3초 후 자동 매칭 시뮬레이션 (80% 확률로 증가)
            setTimeout(async () => {
              if (Math.random() > 0.2) {
                console.log('[InterestStore] 자동 매칭 시뮬레이션 시작');
                
                const mockMatch: InterestMatch = {
                  id: `match_${Date.now()}`,
                  searchId: mockSearch.id,
                  matchedSearchId: `matched_search_${Date.now()}`,
                  matchedUserId: `user_${Math.floor(Math.random() * 10) + 1}`,
                  matchedUser: {
                    id: `user_${Math.floor(Math.random() * 10) + 1}`,
                    nickname: ['커피러버', '책벌레', '영화광', '음악애호가', '산책매니아'][Math.floor(Math.random() * 5)],
                    profileImage: `https://picsum.photos/200/200?random=${Date.now()}`,
                  },
                  matchType: mockSearch.type,
                  matchValue: mockSearch.value,
                  matchedAt: new Date().toISOString(),
                  status: 'ACTIVE',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                
                // AsyncStorage에 매칭 저장
                const existingMatches = await AsyncStorage.getItem('interest-matches');
                const matches = existingMatches ? JSON.parse(existingMatches) : [];
                matches.unshift(mockMatch);
                await AsyncStorage.setItem('interest-matches', JSON.stringify(matches));
                
                // 검색 상태를 매칭됨으로 업데이트
                const updatedSearches = await AsyncStorage.getItem('interest-searches');
                const searchList = updatedSearches ? JSON.parse(updatedSearches) : [];
                const searchIndex = searchList.findIndex((s: InterestSearch) => s.id === mockSearch.id);
                if (searchIndex !== -1) {
                  searchList[searchIndex].status = 'MATCHED';
                  searchList[searchIndex].matchedWithId = mockMatch.matchedUserId;
                  searchList[searchIndex].matchedAt = mockMatch.matchedAt;
                  await AsyncStorage.setItem('interest-searches', JSON.stringify(searchList));
                }
                
                set((state) => ({
                  matches: [mockMatch, ...state.matches],
                  searches: state.searches.map((s) => 
                    s.id === mockSearch.id 
                      ? { ...s, status: 'MATCHED', matchedWithId: mockMatch.matchedUserId, matchedAt: mockMatch.matchedAt }
                      : s
                  ),
                }));
                
                console.log('[InterestStore] 자동 매칭 성공!', mockMatch);
              }
            }, 3000);
            
            return mockSearch;
          }

          const response = await apiClient.post('/interest/search', dto);

          if (response.data.success) {
            const newSearch = response.data.data;
            set((state) => ({
              searches: [newSearch, ...state.searches],
              loading: false,
            }));
            return newSearch;
          } else {
            throw new Error(response.data.message || '검색 등록에 실패했습니다');
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

          if (response.data.success) {
            const updatedSearch = response.data.data;
            set((state) => ({
              searches: state.searches.map((s) => (s.id === id ? updatedSearch : s)),
              loading: false,
            }));
            return updatedSearch;
          } else {
            throw new Error(response.data.message || '검색 업데이트에 실패했습니다');
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

          if (response.data.success || response.status === 204) {
            set((state) => ({
              searches: state.searches.filter((s) => s.id !== id),
              loading: false,
            }));
          } else {
            throw new Error(response.data.message || '검색 삭제에 실패했습니다');
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
          // 개발 환경에서는 Mock 매칭 시뮬레이션
          if (__DEV__) {
            console.log('[InterestStore] Mock 매칭 확인:', dto);
            
            // 50% 확률로 매칭 성공 시뮬레이션
            const isMatched = Math.random() > 0.5;
            
            if (isMatched) {
              const mockMatch: InterestMatch = {
                id: `match_${Date.now()}`,
                searchId: `search_${Date.now()}`,
                matchedSearchId: `matched_search_${Date.now()}`,
                matchedUserId: `user_${Math.floor(Math.random() * 10) + 1}`,
                matchedUser: {
                  id: `user_${Math.floor(Math.random() * 10) + 1}`,
                  nickname: ['커피러버', '책벌레', '영화광', '음악애호가'][Math.floor(Math.random() * 4)],
                  profileImage: `https://picsum.photos/200/200?random=${Date.now()}`,
                },
                matchType: dto.type,
                matchValue: dto.value,
                matchedAt: new Date().toISOString(),
                status: 'ACTIVE',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              
              // AsyncStorage에 매칭 저장
              const existingMatches = await AsyncStorage.getItem('interest-matches');
              const matches = existingMatches ? JSON.parse(existingMatches) : [];
              matches.unshift(mockMatch);
              await AsyncStorage.setItem('interest-matches', JSON.stringify(matches));
              
              set((state) => ({
                matches: [mockMatch, ...state.matches],
                loading: false,
              }));
              
              console.log('[InterestStore] Mock 매칭 성공:', mockMatch);
              return mockMatch;
            } else {
              console.log('[InterestStore] Mock 매칭 실패 - 조건이 맞지 않음');
              set({ loading: false });
              return null;
            }
          }

          const response = await apiClient.post('/interest/check-match', dto);

          if (response.data.success) {
            const match = response.data.data;
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
            throw new Error(response.data.message || '매칭 확인에 실패했습니다');
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