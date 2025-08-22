/**
 * 그룹 상태 관리 Zustand 슬라이스
 * @module groupSlice
 * @description 그룹 생성, 참여, 검색, 필터링 기능 관리
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Group, GroupType } from '@/types';
import { API_BASE_URL } from '@/services/api/config';

/**
 * 두 지점 간 거리 계산
 * @function calculateDistance
 * @param {number} lat1 - 첫 번째 지점의 위도
 * @param {number} lon1 - 첫 번째 지점의 경도
 * @param {number} lat2 - 두 번째 지점의 위도
 * @param {number} lon2 - 두 번째 지점의 경도
 * @returns {number} 거리 (km)
 * @description Haversine 공식을 사용한 두 지점 간 거리 계산
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 그룹 상태 인터페이스
 * @interface GroupState
 * @description 그룹 관련 상태 정보
 */
interface GroupState {
  // State
  /** 전체 그룹 목록 */
  groups: Group[];
  /** 현재 선택된 그룹 */
  currentGroup: Group | null;
  /** 참여한 그룹 목록 */
  joinedGroups: Group[];
  /** 좋아요한 그룹 ID 목록 */
  likedGroupIds: string[];
  /** 그룹별 초대코드 저장 */
  groupInviteCodes: Record<string, string>;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
  
  // Filters and search
  /** 검색 쿼리 */
  searchQuery: string;
  /** 선택된 그룹 타입 필터 */
  selectedGroupType: GroupType | null;
  /** 위치 기반 필터 */
  locationFilter: {
    /** 위도 */
    latitude?: number;
    /** 경도 */
    longitude?: number;
    /** 반경 (km) */
    radius?: number;
  } | null;
}

/**
 * 그룹 스토어 인터페이스
 * @interface GroupStore
 * @description 그룹 상태와 액션을 포함한 전체 스토어
 */
interface GroupStore extends GroupState {
  // Actions
  /** 그룹 목록 설정 */
  setGroups: (groups: Group[]) => void;
  /** 그룹 추가 */
  addGroup: (group: Group) => void;
  /** 그룹 생성 */
  createGroup: (group: Group) => void;
  /** 그룹 정보 업데이트 */
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  /** 그룹 삭제 */
  removeGroup: (groupId: string) => void;
  /** 현재 그룹 설정 */
  setCurrentGroup: (group: Group | null) => void;
  /** 그룹 참여 */
  joinGroup: (groupId: string) => Promise<void>;
  /** 그룹 나가기 */
  leaveGroup: (groupId: string) => Promise<void>;
  /** 그룹 초대코드 생성 또는 가져오기 */
  getOrCreateInviteCode: (groupId: string) => Promise<string>;
  /** 초대코드로 그룹 참여 */
  joinGroupByInviteCode: (inviteCode: string) => Promise<void>;
  /** 그룹 좋아요 토글 */
  toggleGroupLike: (groupId: string) => Promise<void>;
  /** 그룹이 좋아요 되었는지 확인 */
  isGroupLiked: (groupId: string) => boolean;
  /** 로딩 상태 설정 */
  setLoading: (isLoading: boolean) => void;
  /** 에러 설정 */
  setError: (error: string | null) => void;
  /** 에러 초기화 */
  clearError: () => void;
  
  // Search and filter actions
  /** 검색 쿼리 설정 */
  setSearchQuery: (query: string) => void;
  /** 그룹 타입 필터 설정 */
  setGroupTypeFilter: (type: GroupType | null) => void;
  /** 위치 필터 설정 */
  setLocationFilter: (filter: GroupState['locationFilter']) => void;
  /** 모든 필터 초기화 */
  clearFilters: () => void;
  
  // Computed values
  /** 필터링된 그룹 목록 반환 */
  getFilteredGroups: () => Group[];
  /** ID로 그룹 찾기 */
  getGroupById: (groupId: string) => Group | undefined;
  /** 사용자가 그룹에 참여했는지 확인 */
  isUserInGroup: (groupId: string) => boolean;
}

/**
 * 그룹 상태 관리 스토어
 * @constant useGroupStore
 * @description 그룹 생성, 참여, 검색, 필터링을 관리하는 Zustand 스토어
 * @example
 * ```typescript
 * const { groups, joinGroup, getFilteredGroups } = useGroupStore();
 * ```
 */
// 샘플 그룹 데이터
const sampleGroups: Group[] = [
  {
    id: 'group-1',
    name: '서강대학교',
    type: GroupType.OFFICIAL,
    description: '서강대학교 공식 그룹입니다.',
    memberCount: 1234,
    maleCount: 650,
    femaleCount: 584,
    creatorId: 'current_user', // 내가 만든 그룹
    isMatchingActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'group-2',
    name: '강남 러닝 크루',
    type: GroupType.CREATED,
    description: '매주 화요일, 목요일 저녁 7시 한강에서 함께 달려요!',
    memberCount: 89,
    maleCount: 45,
    femaleCount: 44,
    creatorId: 'current_user', // 내가 만든 그룹
    isMatchingActive: true,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date(),
  },
  {
    id: 'group-3',
    name: '삼성전자',
    type: GroupType.OFFICIAL,
    description: '삼성전자 임직원 그룹',
    memberCount: 5678,
    maleCount: 3500,
    femaleCount: 2178,
    creatorId: 'other_user', // 내가 참여한 그룹
    isMatchingActive: true,
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date(),
  },
  {
    id: 'group-4',
    name: '독서 모임 - 책갈피',
    type: GroupType.CREATED,
    description: '매월 한 권의 책을 함께 읽고 토론하는 모임입니다.',
    memberCount: 45,
    maleCount: 20,
    femaleCount: 25,
    creatorId: 'other_user', // 내가 참여한 그룹
    isMatchingActive: true,
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date(),
  },
  {
    id: 'group-5',
    name: '스타벅스 강남역점',
    type: GroupType.LOCATION,
    description: '스타벅스 강남역점에 있는 사람들의 그룹',
    memberCount: 23,
    maleCount: 12,
    femaleCount: 11,
    creatorId: 'other_user', // 내가 참여한 그룹
    isMatchingActive: true,
    location: {
      latitude: 37.498095,
      longitude: 127.027610,
      address: '서울 강남구 강남대로 390',
    },
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date(),
  },
];

export const useGroupStore = create<GroupStore>()(
  persist(
    (set, get) => ({
  // Initial state with sample data
  /** 전체 그룹 목록 */
  groups: sampleGroups,
  /** 현재 선택된 그룹 */
  currentGroup: null,
  /** 참여한 그룹 목록 - 샘플 데이터로 초기화 */
  joinedGroups: sampleGroups, // 모든 샘플 그룹에 참여한 상태로 시작
  /** 좋아요한 그룹 ID 목록 */
  likedGroupIds: [],
  /** 그룹별 초대코드 저장 */
  groupInviteCodes: {},
  /** 로딩 상태 */
  isLoading: false,
  /** 에러 메시지 */
  error: null,
  /** 검색 쿼리 */
  searchQuery: '',
  /** 선택된 그룹 타입 */
  selectedGroupType: null,
  /** 위치 필터 */
  locationFilter: null,

  // Actions
  /**
   * 그룹 목록 설정
   * @param {Group[]} groups - 설정할 그룹 목록
   * @description 전체 그룹 목록을 새로 설정하고 에러 초기화
   */
  setGroups: (groups: Group[]) => {
    set({ groups, error: null });
  },

  /**
   * 그룹 추가
   * @param {Group} group - 추가할 그룹
   * @description 기존 목록에 새 그룹 추가
   */
  addGroup: (group: Group) => {
    set((state) => ({
      groups: [...state.groups, group],
    }));
  },

  /**
   * 그룹 생성
   * @param {Group} group - 생성할 그룹
   * @description 새 그룹을 생성하고 자동으로 참여 목록에 추가
   */
  createGroup: (group: Group) => {
    set((state) => ({
      groups: [...state.groups, group],
      joinedGroups: [...state.joinedGroups, group], // 생성자는 자동으로 참여
    }));
  },

  /**
   * 그룹 정보 업데이트
   * @param {string} groupId - 그룹 ID
   * @param {Partial<Group>} updates - 업데이트할 정보
   * @description 특정 그룹의 정보를 부분적으로 업데이트
   */
  updateGroup: (groupId: string, updates: Partial<Group>) => {
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === groupId ? { ...group, ...updates } : group
      ),
      joinedGroups: state.joinedGroups.map((group) =>
        group.id === groupId ? { ...group, ...updates } : group
      ),
      currentGroup:
        state.currentGroup?.id === groupId
          ? { ...state.currentGroup, ...updates }
          : state.currentGroup,
    }));
  },

  /**
   * 그룹 삭제
   * @param {string} groupId - 삭제할 그룹 ID
   * @description 모든 목록에서 그룹을 제거
   */
  removeGroup: (groupId: string) => {
    set((state) => ({
      groups: state.groups.filter((group) => group.id !== groupId),
      joinedGroups: state.joinedGroups.filter((group) => group.id !== groupId),
      currentGroup: state.currentGroup?.id === groupId ? null : state.currentGroup,
    }));
  },

  /**
   * 현재 그룹 설정
   * @param {Group | null} group - 설정할 그룹
   * @description 현재 선택된 그룹을 변경
   */
  setCurrentGroup: (group: Group | null) => {
    set({ currentGroup: group });
  },

  /**
   * 그룹 참여
   * @param {string} groupId - 참여할 그룹 ID
   * @description 그룹에 참여하고 참여 목록에 추가 (중복 체크)
   */
  joinGroup: async (groupId: string) => {
    const state = get();
    const isAlreadyJoined = state.joinedGroups.some((g) => g.id === groupId);
    if (isAlreadyJoined) return;

    try {
      // API 호출
      const response = await fetch(`/api/v1/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-auth': 'true',
        },
      });

      if (response.ok) {
        // 그룹 찾아서 joinedGroups에 추가
        const group = state.groups.find(g => g.id === groupId);
        if (group) {
          set((state) => ({
            joinedGroups: [...state.joinedGroups, group],
          }));
        }
      }
    } catch (error) {
      console.error('Failed to join group:', error);
      throw error;
    }
  },

  /**
   * 그룹 나가기
   * @param {string} groupId - 나갈 그룹 ID
   * @description 그룹에서 탈퇴하고 서버와 동기화
   */
  leaveGroup: async (groupId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}/leave`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-auth': 'true',
        },
      });

      if (response.ok) {
        set((state) => ({
          joinedGroups: state.joinedGroups.filter((group) => group.id !== groupId),
          currentGroup: state.currentGroup?.id === groupId ? null : state.currentGroup,
        }));
      }
    } catch (error) {
      console.error('Failed to leave group:', error);
      throw error;
    }
  },

  /**
   * 그룹 초대코드 생성 또는 가져오기
   * @param {string} groupId - 그룹 ID
   * @returns {Promise<string>} 초대코드
   * @description 캐시된 초대코드를 반환하거나 새로 생성
   */
  getOrCreateInviteCode: async (groupId: string) => {
    const state = get();
    
    // 캐시된 초대코드가 있으면 반환
    if (state.groupInviteCodes[groupId]) {
      return state.groupInviteCodes[groupId];
    }

    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-auth': 'true',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const inviteCode = data.data.inviteLink.split('/').pop(); // 초대코드만 추출
        
        // 초대코드 캐시
        set((state) => ({
          groupInviteCodes: {
            ...state.groupInviteCodes,
            [groupId]: inviteCode,
          },
        }));
        
        return inviteCode;
      }
      throw new Error('Failed to generate invite code');
    } catch (error) {
      console.error('Failed to get/create invite code:', error);
      throw error;
    }
  },

  /**
   * 초대코드로 그룹 참여
   * @param {string} inviteCode - 초대코드
   * @description 초대코드를 사용하여 그룹에 참여
   */
  joinGroupByInviteCode: async (inviteCode: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/groups/join/${inviteCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-auth': 'true',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const group = data.data;
        
        set((state) => {
          const isAlreadyJoined = state.joinedGroups.some(g => g.id === group.id);
          if (!isAlreadyJoined) {
            return {
              joinedGroups: [...state.joinedGroups, group],
              groups: state.groups.some(g => g.id === group.id) 
                ? state.groups 
                : [...state.groups, group],
            };
          }
          return state;
        });
      }
    } catch (error) {
      console.error('Failed to join group by invite code:', error);
      throw error;
    }
  },

  /**
   * 그룹 좋아요 토글
   * @param {string} groupId - 그룹 ID
   * @description 그룹의 좋아요 상태를 토글하고 서버와 동기화
   */
  toggleGroupLike: async (groupId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-auth': 'true',
        },
      });

      if (response.ok) {
        const data = await response.json();
        set((state) => {
          const isLiked = state.likedGroupIds.includes(groupId);
          return {
            likedGroupIds: data.data.liked
              ? [...state.likedGroupIds.filter(id => id !== groupId), groupId]
              : state.likedGroupIds.filter(id => id !== groupId)
          };
        });
      }
    } catch (error) {
      console.error('Failed to toggle group like:', error);
      throw error;
    }
  },

  /**
   * 그룹이 좋아요 되었는지 확인
   * @param {string} groupId - 그룹 ID
   * @returns {boolean} 좋아요 여부
   */
  isGroupLiked: (groupId: string) => {
    return get().likedGroupIds.includes(groupId);
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  // Search and filter actions
  /**
   * 검색 쿼리 설정
   * @param {string} query - 검색어
   * @description 그룹 이름이나 설명으로 검색할 쿼리 설정
   */
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  /**
   * 그룹 타입 필터 설정
   * @param {GroupType | null} type - 필터링할 그룹 타입
   * @description 특정 타입의 그룹만 표시하도록 필터 설정
   */
  setGroupTypeFilter: (type: GroupType | null) => {
    set({ selectedGroupType: type });
  },

  /**
   * 위치 필터 설정
   * @param {GroupState['locationFilter']} filter - 위치 필터 정보
   * @description 특정 위치 반경 내의 그룹만 표시하도록 필터 설정
   */
  setLocationFilter: (filter: GroupState['locationFilter']) => {
    set({ locationFilter: filter });
  },

  /**
   * 모든 필터 초기화
   * @description 검색어, 타입, 위치 필터를 모두 초기화
   */
  clearFilters: () => {
    set({
      searchQuery: '',
      selectedGroupType: null,
      locationFilter: null,
    });
  },

  // Computed values
  /**
   * 필터링된 그룹 목록 반환
   * @returns {Group[]} 필터링된 그룹 목록
   * @description 검색어, 타입, 위치 필터를 적용한 그룹 목록 반환
   */
  getFilteredGroups: () => {
    const state = get();
    let filtered = state.groups;

    // 검색 쿼리 필터
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (group) =>
          group.name.toLowerCase().includes(query) ||
          group.description?.toLowerCase().includes(query)
      );
    }

    // 그룹 타입 필터
    if (state.selectedGroupType) {
      filtered = filtered.filter((group) => group.type === state.selectedGroupType);
    }

    // 위치 필터 (장소기반 그룹용)
    if (state.locationFilter && state.locationFilter.latitude && state.locationFilter.longitude) {
      const { latitude, longitude, radius = 1 } = state.locationFilter;
      filtered = filtered.filter((group) => {
        if (!group.location) return false;
        
        // 간단한 거리 계산 (Haversine 공식 근사)
        const distance = calculateDistance(
          latitude,
          longitude,
          group.location.latitude,
          group.location.longitude
        );
        
        return distance <= radius;
      });
    }

    return filtered;
  },

  /**
   * ID로 그룹 찾기
   * @param {string} groupId - 찾을 그룹 ID
   * @returns {Group | undefined} 찾은 그룹 또는 undefined
   */
  getGroupById: (groupId: string) => {
    return get().groups.find((group) => group.id === groupId);
  },

  /**
   * 사용자가 그룹에 참여했는지 확인
   * @param {string} groupId - 확인할 그룹 ID
   * @returns {boolean} 참여 여부
   */
  isUserInGroup: (groupId: string) => {
    return get().joinedGroups.some((group) => group.id === groupId);
  },

  /**
   * 그룹 데이터 초기화 (로그아웃 시 사용)
   * @returns {void}
   * @description 모든 그룹 관련 데이터를 초기 상태로 리셋
   */
  clearGroups: (): void => {
    set({
      groups: [],
      joinedGroups: [],
      nearbyGroups: [],
      officialGroups: [],
      createdGroups: [],
      locationGroups: [],
      instantGroups: [],
      likedGroupIds: [],
      groupInviteCodes: {},
      searchTerm: '',
      selectedGroupType: null,
      sortBy: 'memberCount',
      categoryFilter: null,
      locationFilter: null,
      isLoading: false,
      error: null,
    });
  },
    }),
    {
      name: 'group-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        likedGroupIds: state.likedGroupIds,
        groupInviteCodes: state.groupInviteCodes,
      }),
    }
  )
);