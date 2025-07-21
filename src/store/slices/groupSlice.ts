import { create } from 'zustand';
import { Group, GroupType } from '@/types';

interface GroupState {
  // State
  groups: Group[];
  currentGroup: Group | null;
  joinedGroups: Group[];
  isLoading: boolean;
  error: string | null;
  
  // Filters and search
  searchQuery: string;
  selectedGroupType: GroupType | null;
  locationFilter: {
    latitude?: number;
    longitude?: number;
    radius?: number; // km
  } | null;
}

interface GroupStore extends GroupState {
  // Actions
  setGroups: (groups: Group[]) => void;
  addGroup: (group: Group) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  removeGroup: (groupId: string) => void;
  setCurrentGroup: (group: Group | null) => void;
  joinGroup: (group: Group) => void;
  leaveGroup: (groupId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Search and filter actions
  setSearchQuery: (query: string) => void;
  setGroupTypeFilter: (type: GroupType | null) => void;
  setLocationFilter: (filter: GroupState['locationFilter']) => void;
  clearFilters: () => void;
  
  // Computed values
  getFilteredGroups: () => Group[];
  getGroupById: (groupId: string) => Group | undefined;
  isUserInGroup: (groupId: string) => boolean;
}

export const useGroupStore = create<GroupStore>((set, get) => ({
  // Initial state
  groups: [],
  currentGroup: null,
  joinedGroups: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedGroupType: null,
  locationFilter: null,

  // Actions
  setGroups: (groups: Group[]) => {
    set({ groups, error: null });
  },

  addGroup: (group: Group) => {
    set((state) => ({
      groups: [...state.groups, group],
    }));
  },

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

  removeGroup: (groupId: string) => {
    set((state) => ({
      groups: state.groups.filter((group) => group.id !== groupId),
      joinedGroups: state.joinedGroups.filter((group) => group.id !== groupId),
      currentGroup: state.currentGroup?.id === groupId ? null : state.currentGroup,
    }));
  },

  setCurrentGroup: (group: Group | null) => {
    set({ currentGroup: group });
  },

  joinGroup: (group: Group) => {
    set((state) => {
      const isAlreadyJoined = state.joinedGroups.some((g) => g.id === group.id);
      if (isAlreadyJoined) return state;

      return {
        joinedGroups: [...state.joinedGroups, group],
      };
    });
  },

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
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setGroupTypeFilter: (type: GroupType | null) => {
    set({ selectedGroupType: type });
  },

  setLocationFilter: (filter: GroupState['locationFilter']) => {
    set({ locationFilter: filter });
  },

  clearFilters: () => {
    set({
      searchQuery: '',
      selectedGroupType: null,
      locationFilter: null,
    });
  },

  // Computed values
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

  getGroupById: (groupId: string) => {
    return get().groups.find((group) => group.id === groupId);
  },

  isUserInGroup: (groupId: string) => {
    return get().joinedGroups.some((group) => group.id === groupId);
  },
}));

// 거리 계산 헬퍼 함수 (Haversine 공식)
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