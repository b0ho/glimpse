/**
 * 그룹 상태 관리 Zustand 슬라이스
 * @module groupSlice
 * @description 그룹 생성, 참여, 검색, 필터링 기능 관리
 */

import { create } from 'zustand';
import { Group, GroupType } from '@/types';

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
  joinGroup: (group: Group) => void;
  /** 그룹 나가기 */
  leaveGroup: (groupId: string) => void;
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
export const useGroupStore = create<GroupStore>((set, get) => ({
  // Initial state
  /** 전체 그룹 목록 */
  groups: [],
  /** 현재 선택된 그룹 */
  currentGroup: null,
  /** 참여한 그룹 목록 */
  joinedGroups: [],
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
   * @param {Group} group - 참여할 그룹
   * @description 그룹에 참여하고 참여 목록에 추가 (중복 체크)
   */
  joinGroup: (group: Group) => {
    set((state) => {
      const isAlreadyJoined = state.joinedGroups.some((g) => g.id === group.id);
      if (isAlreadyJoined) return state;

      return {
        joinedGroups: [...state.joinedGroups, group],
      };
    });
  },

  /**
   * 그룹 나가기
   * @param {string} groupId - 나갈 그룹 ID
   * @description 참여 목록에서 그룹을 제거하고 현재 그룹 초기화
   */
  leaveGroup: (groupId: string) => {
    set((state) => ({
      joinedGroups: state.joinedGroups.filter((group) => group.id !== groupId),
      currentGroup: state.currentGroup?.id === groupId ? null : state.currentGroup,
    }));
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
}));

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