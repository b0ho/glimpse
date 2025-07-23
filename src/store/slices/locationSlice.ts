import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { locationService, LocationData, NearbyPlace } from '@/services/location/location-service';

export interface LocationBasedGroup {
  id: string;
  name: string;
  description: string;
  placeId: string;
  placeName: string;
  category: string;
  latitude: number;
  longitude: number;
  radius: number; // 참여 가능 반경 (미터)
  memberCount: number;
  maxMembers: number;
  createdAt: Date;
  isActive: boolean;
}

export interface NearbyUser {
  id: string;
  nickname: string;
  distance: number; // 미터
  lastSeen: Date;
  isOnline: boolean;
  commonGroups?: string[];
}

interface LocationState {
  // 현재 위치
  currentLocation: LocationData | null;
  locationPermissionGranted: boolean;
  isLocationLoading: boolean;
  
  // 근처 장소
  nearbyPlaces: NearbyPlace[];
  isPlacesLoading: boolean;
  
  // 위치 기반 그룹
  locationBasedGroups: LocationBasedGroup[];
  isGroupsLoading: boolean;
  
  // 근처 사용자
  nearbyUsers: NearbyUser[];
  isUsersLoading: boolean;
  
  // 위치 감시 상태
  isWatchingLocation: boolean;
  
  // 에러 상태
  error: string | null;
}

interface LocationActions {
  // 위치 권한 및 현재 위치
  requestLocationPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<LocationData | null>;
  startLocationWatching: () => Promise<boolean>;
  stopLocationWatching: () => void;
  
  // 근처 장소
  loadNearbyPlaces: (radius?: number) => Promise<void>;
  
  // 위치 기반 그룹
  loadLocationBasedGroups: (radius?: number) => Promise<void>;
  createLocationBasedGroup: (groupData: Omit<LocationBasedGroup, 'id' | 'createdAt' | 'memberCount'>) => Promise<string | null>;
  joinLocationBasedGroup: (groupId: string) => Promise<boolean>;
  leaveLocationBasedGroup: (groupId: string) => Promise<boolean>;
  
  // 근처 사용자
  loadNearbyUsers: (radius?: number) => Promise<void>;
  
  // 유틸리티
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  isWithinGroupRadius: (groupId: string) => boolean;
  
  // 상태 관리
  setError: (error: string | null) => void;
  clearLocationData: () => void;
}

type LocationStore = LocationState & LocationActions;

export const useLocationStore = create<LocationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentLocation: null,
      locationPermissionGranted: false,
      isLocationLoading: false,
      nearbyPlaces: [],
      isPlacesLoading: false,
      locationBasedGroups: [],
      isGroupsLoading: false,
      nearbyUsers: [],
      isUsersLoading: false,
      isWatchingLocation: false,
      error: null,

      // Actions
      requestLocationPermission: async () => {
        try {
          set({ isLocationLoading: true, error: null });
          const granted = await locationService.requestLocationPermissions();
          set({ locationPermissionGranted: granted, isLocationLoading: false });
          return granted;
        } catch (error) {
          console.error('Location permission error:', error);
          set({ 
            error: '위치 권한 요청에 실패했습니다.',
            isLocationLoading: false,
            locationPermissionGranted: false 
          });
          return false;
        }
      },

      getCurrentLocation: async () => {
        try {
          set({ isLocationLoading: true, error: null });
          const location = await locationService.getCurrentLocation();
          set({ 
            currentLocation: location,
            isLocationLoading: false,
            locationPermissionGranted: !!location 
          });
          return location;
        } catch (error) {
          console.error('Get current location error:', error);
          set({ 
            error: '현재 위치를 가져올 수 없습니다.',
            isLocationLoading: false 
          });
          return null;
        }
      },

      startLocationWatching: async () => {
        try {
          const success = await locationService.startLocationWatching(
            (location) => {
              set({ currentLocation: location });
              // 위치 변경 시 주변 데이터 자동 업데이트
              const state = get();
              if (!state.isPlacesLoading) {
                state.loadNearbyPlaces();
              }
              if (!state.isUsersLoading) {
                state.loadNearbyUsers();
              }
            },
            {
              distanceInterval: 200, // 200m마다
              timeInterval: 60000, // 1분마다
            }
          );
          
          set({ isWatchingLocation: success });
          return success;
        } catch (error) {
          console.error('Start location watching error:', error);
          set({ error: '위치 감시를 시작할 수 없습니다.' });
          return false;
        }
      },

      stopLocationWatching: () => {
        locationService.stopLocationWatching();
        set({ isWatchingLocation: false });
      },

      loadNearbyPlaces: async (radius = 1000) => {
        try {
          set({ isPlacesLoading: true, error: null });
          
          const location = get().currentLocation || await get().getCurrentLocation();
          if (!location) {
            set({ error: '현재 위치를 알 수 없어 근처 장소를 찾을 수 없습니다.' });
            return;
          }

          const places = await locationService.findNearbyPlaces(
            location.latitude,
            location.longitude,
            radius
          );

          set({ nearbyPlaces: places, isPlacesLoading: false });
        } catch (error) {
          console.error('Load nearby places error:', error);
          set({ 
            error: '근처 장소를 불러오는데 실패했습니다.',
            isPlacesLoading: false 
          });
        }
      },

      loadLocationBasedGroups: async (radius = 2000) => {
        try {
          set({ isGroupsLoading: true, error: null });
          
          const location = get().currentLocation || await get().getCurrentLocation();
          if (!location) {
            set({ error: '현재 위치를 알 수 없어 근처 그룹을 찾을 수 없습니다.' });
            return;
          }

          // TODO: 실제 API 호출로 교체
          // 임시 더미 데이터
          const dummyGroups: LocationBasedGroup[] = [
            {
              id: 'loc_group_1',
              name: '강남 스타벅스 모임',
              description: '커피 좋아하는 사람들의 모임',
              placeId: 'place_1',
              placeName: '스타벅스 강남점',
              category: 'cafe',
              latitude: location.latitude + 0.001,
              longitude: location.longitude + 0.001,
              radius: 100,
              memberCount: 12,
              maxMembers: 50,
              createdAt: new Date('2024-01-20'),
              isActive: true,
            },
            {
              id: 'loc_group_2',
              name: '연세대 학생 모임',
              description: '연세대학교 재학생/졸업생 모임',
              placeId: 'place_2',
              placeName: '연세대학교',
              category: 'university',
              latitude: location.latitude + 0.002,
              longitude: location.longitude - 0.001,
              radius: 500,
              memberCount: 28,
              maxMembers: 100,
              createdAt: new Date('2024-01-18'),
              isActive: true,
            },
            {
              id: 'loc_group_3',
              name: '판교 IT 개발자 모임',
              description: '판교 테크노밸리 개발자들의 네트워킹',
              placeId: 'place_3',
              placeName: '네이버 그린팩토리',
              category: 'company',
              latitude: location.latitude - 0.002,
              longitude: location.longitude + 0.002,
              radius: 300,
              memberCount: 45,
              maxMembers: 80,
              createdAt: new Date('2024-01-15'),
              isActive: true,
            },
          ];

          // 반경 내 그룹만 필터링
          const nearbyGroups = dummyGroups.filter(group => {
            const distance = locationService.calculateDistance(
              location.latitude,
              location.longitude,
              group.latitude,
              group.longitude
            );
            return distance <= radius;
          });

          set({ locationBasedGroups: nearbyGroups, isGroupsLoading: false });
        } catch (error) {
          console.error('Load location-based groups error:', error);
          set({ 
            error: '근처 그룹을 불러오는데 실패했습니다.',
            isGroupsLoading: false 
          });
        }
      },

      createLocationBasedGroup: async (groupData) => {
        try {
          set({ error: null });
          
          // TODO: 실제 API 호출로 교체
          const newGroup: LocationBasedGroup = {
            ...groupData,
            id: `loc_group_${Date.now()}`,
            memberCount: 1, // 생성자 포함
            createdAt: new Date(),
          };

          set(state => ({
            locationBasedGroups: [...state.locationBasedGroups, newGroup]
          }));

          return newGroup.id;
        } catch (error) {
          console.error('Create location-based group error:', error);
          set({ error: '그룹 생성에 실패했습니다.' });
          return null;
        }
      },

      joinLocationBasedGroup: async (groupId) => {
        try {
          set({ error: null });
          
          const group = get().locationBasedGroups.find(g => g.id === groupId);
          if (!group) {
            set({ error: '그룹을 찾을 수 없습니다.' });
            return false;
          }

          // 현재 위치가 그룹 반경 내에 있는지 확인
          if (!get().isWithinGroupRadius(groupId)) {
            set({ error: '그룹 참여 가능 위치에 있지 않습니다.' });
            return false;
          }

          // 최대 인원 확인
          if (group.memberCount >= group.maxMembers) {
            set({ error: '그룹이 가득 찼습니다.' });
            return false;
          }

          // TODO: 실제 API 호출로 교체
          set(state => ({
            locationBasedGroups: state.locationBasedGroups.map(g =>
              g.id === groupId
                ? { ...g, memberCount: g.memberCount + 1 }
                : g
            )
          }));

          return true;
        } catch (error) {
          console.error('Join location-based group error:', error);
          set({ error: '그룹 참여에 실패했습니다.' });
          return false;
        }
      },

      leaveLocationBasedGroup: async (groupId) => {
        try {
          set({ error: null });
          
          // TODO: 실제 API 호출로 교체
          set(state => ({
            locationBasedGroups: state.locationBasedGroups.map(g =>
              g.id === groupId
                ? { ...g, memberCount: Math.max(0, g.memberCount - 1) }
                : g
            )
          }));

          return true;
        } catch (error) {
          console.error('Leave location-based group error:', error);
          set({ error: '그룹 탈퇴에 실패했습니다.' });
          return false;
        }
      },

      loadNearbyUsers: async (radius = 1000) => {
        try {
          set({ isUsersLoading: true, error: null });

          const location = get().currentLocation || await get().getCurrentLocation();
          if (!location) {
            set({ error: '현재 위치를 알 수 없어 근처 사용자를 찾을 수 없습니다.' });
            return;
          }

          // TODO: 실제 API 호출로 교체
          // 개인정보 보호를 위해 매우 제한적인 정보만 제공
          const dummyUsers: NearbyUser[] = [
            {
              id: 'nearby_user_1',
              nickname: '커피러버',
              distance: 150,
              lastSeen: new Date(),
              isOnline: true,
              commonGroups: ['loc_group_1'],
            },
            {
              id: 'nearby_user_2',
              nickname: '연세학생',
              distance: 300,
              lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5분 전
              isOnline: false,
              commonGroups: ['loc_group_2'],
            },
            {
              id: 'nearby_user_3',
              nickname: '개발자A',
              distance: 500,
              lastSeen: new Date(Date.now() - 10 * 60 * 1000), // 10분 전
              isOnline: true,
              commonGroups: ['loc_group_3'],
            },
          ];

          // 반경 내 사용자만 필터링
          const nearbyUsers = dummyUsers.filter(user => user.distance <= radius);

          set({ nearbyUsers, isUsersLoading: false });
        } catch (error) {
          console.error('Load nearby users error:', error);
          set({ 
            error: '근처 사용자를 불러오는데 실패했습니다.',
            isUsersLoading: false 
          });
        }
      },

      calculateDistance: (lat1, lon1, lat2, lon2) => {
        return locationService.calculateDistance(lat1, lon1, lat2, lon2);
      },

      isWithinGroupRadius: (groupId) => {
        const state = get();
        const group = state.locationBasedGroups.find(g => g.id === groupId);
        if (!group || !state.currentLocation) {
          return false;
        }

        const distance = locationService.calculateDistance(
          state.currentLocation.latitude,
          state.currentLocation.longitude,
          group.latitude,
          group.longitude
        );

        return distance <= group.radius;
      },

      setError: (error) => {
        set({ error });
      },

      clearLocationData: () => {
        locationService.cleanup();
        set({
          currentLocation: null,
          locationPermissionGranted: false,
          nearbyPlaces: [],
          locationBasedGroups: [],
          nearbyUsers: [],
          isWatchingLocation: false,
          error: null,
        });
      },
    }),
    {
      name: 'location-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // 민감하지 않은 데이터만 persist
        locationPermissionGranted: state.locationPermissionGranted,
        // 위치 데이터는 보안상 persist하지 않음
      }),
    }
  )
);