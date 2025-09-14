import { create, persist, createJSONStorage } from '../zustandCompat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { locationService, LocationData, NearbyPlace } from '@/services/location/location-service';

/**
 * 위치 기반 그룹 인터페이스
 * @interface LocationBasedGroup
 * @description 특정 위치에 기반한 그룹 정보
 */
export interface LocationBasedGroup {
  /** 그룹 ID */
  id: string;
  /** 그룹 이름 */
  name: string;
  /** 그룹 설명 */
  description: string;
  /** 장소 ID */
  placeId: string;
  /** 장소 이름 */
  placeName: string;
  /** 장소 카테고리 */
  category: string;
  /** 위도 */
  latitude: number;
  /** 경도 */
  longitude: number;
  /** 참여 가능 반경 (미터) */
  radius: number;
  /** 현재 멤버 수 */
  memberCount: number;
  /** 최대 멤버 수 */
  maxMembers: number;
  /** 생성일 */
  createdAt: Date;
  /** 활성 여부 */
  isActive: boolean;
}

/**
 * 근처 사용자 인터페이스
 * @interface NearbyUser
 * @description 주변에 있는 사용자 정보 (개인정보 보호를 위해 제한적 정보만 포함)
 */
export interface NearbyUser {
  /** 사용자 ID */
  id: string;
  /** 닉네임 */
  nickname: string;
  /** 거리 (미터) */
  distance: number;
  /** 마지막 활동 시간 */
  lastSeen: Date;
  /** 온라인 여부 */
  isOnline: boolean;
  /** 공통 그룹 ID 목록 */
  commonGroups?: string[];
}

/**
 * 위치 상태 인터페이스
 * @interface LocationState
 * @description 위치 관련 모든 상태 정보
 */
interface LocationState {
  // 현재 위치
  /** 현재 위치 정보 */
  currentLocation: LocationData | null;
  /** 위치 권한 허가 여부 */
  locationPermissionGranted: boolean;
  /** 위치 로딩 상태 */
  isLocationLoading: boolean;
  
  // 근처 장소
  /** 근처 장소 목록 */
  nearbyPlaces: NearbyPlace[];
  /** 장소 로딩 상태 */
  isPlacesLoading: boolean;
  
  // 위치 기반 그룹
  /** 위치 기반 그룹 목록 */
  locationBasedGroups: LocationBasedGroup[];
  /** 그룹 로딩 상태 */
  isGroupsLoading: boolean;
  
  // 근처 사용자
  /** 근처 사용자 목록 */
  nearbyUsers: NearbyUser[];
  /** 사용자 로딩 상태 */
  isUsersLoading: boolean;
  
  // 위치 감시 상태
  /** 위치 감시 중 여부 */
  isWatchingLocation: boolean;
  
  // 에러 상태
  /** 에러 메시지 */
  error: string | null;
}

/**
 * 위치 액션 인터페이스
 * @interface LocationActions
 * @description 위치 관련 모든 액션 메서드
 */
interface LocationActions {
  // 위치 권한 및 현재 위치
  /** 위치 권한 요청 */
  requestLocationPermission: () => Promise<boolean>;
  /** 현재 위치 가져오기 */
  getCurrentLocation: () => Promise<LocationData | null>;
  /** 위치 감시 시작 */
  startLocationWatching: () => Promise<boolean>;
  /** 위치 감시 중지 */
  stopLocationWatching: () => void;
  
  // 근처 장소
  /** 근처 장소 로드 */
  loadNearbyPlaces: (radius?: number) => Promise<void>;
  
  // 위치 기반 그룹
  /** 위치 기반 그룹 로드 */
  loadLocationBasedGroups: (radius?: number) => Promise<void>;
  /** 위치 기반 그룹 생성 */
  createLocationBasedGroup: (groupData: Omit<LocationBasedGroup, 'id' | 'createdAt' | 'memberCount'>) => Promise<string | null>;
  /** 위치 기반 그룹 참여 */
  joinLocationBasedGroup: (groupId: string) => Promise<boolean>;
  /** 위치 기반 그룹 탈퇴 */
  leaveLocationBasedGroup: (groupId: string) => Promise<boolean>;
  
  // 근처 사용자
  /** 근처 사용자 로드 */
  loadNearbyUsers: (radius?: number) => Promise<void>;
  
  // 유틸리티
  /** 두 지점 간 거리 계산 */
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  /** 그룹 반경 내 위치 여부 확인 */
  isWithinGroupRadius: (groupId: string) => boolean;
  
  // 상태 관리
  /** 에러 메시지 설정 */
  setError: (error: string | null) => void;
  /** 위치 데이터 초기화 */
  clearLocationData: () => void;
}

/**
 * 위치 스토어 타입
 * @type LocationStore
 * @description 위치 상태와 액션을 포함한 전체 스토어 타입
 */
type LocationStore = LocationState & LocationActions;

/**
 * 위치 상태 관리 스토어
 * @constant useLocationStore
 * @description GPS 기반 위치 서비스, 근처 장소/그룹/사용자를 관리하는 Zustand 스토어
 * @example
 * ```typescript
 * const { getCurrentLocation, nearbyPlaces, locationBasedGroups } = useLocationStore();
 * ```
 */
export const useLocationStore = create<LocationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      /** 현재 위치 */
      currentLocation: null,
      /** 위치 권한 허가 여부 */
      locationPermissionGranted: false,
      /** 위치 로딩 상태 */
      isLocationLoading: false,
      /** 근처 장소 목록 */
      nearbyPlaces: [],
      /** 장소 로딩 상태 */
      isPlacesLoading: false,
      /** 위치 기반 그룹 목록 */
      locationBasedGroups: [],
      /** 그룹 로딩 상태 */
      isGroupsLoading: false,
      /** 근처 사용자 목록 */
      nearbyUsers: [],
      /** 사용자 로딩 상태 */
      isUsersLoading: false,
      /** 위치 감시 중 여부 */
      isWatchingLocation: false,
      /** 에러 메시지 */
      error: null,

      // Actions
      /**
       * 위치 권한 요청
       * @async
       * @returns {Promise<boolean>} 권한 허가 여부
       * @description 사용자에게 위치 권한을 요청
       */
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

      /**
       * 현재 위치 가져오기
       * @async
       * @returns {Promise<LocationData | null>} 위치 데이터 또는 null
       * @description GPS로 현재 위치를 조회
       */
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

      /**
       * 위치 감시 시작
       * @async
       * @returns {Promise<boolean>} 성공 여부
       * @description 주기적으로 위치를 추적하고 주변 데이터 자동 업데이트
       */
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

      /**
       * 위치 감시 중지
       * @description 위치 추적을 중단
       */
      stopLocationWatching: () => {
        locationService.stopLocationWatching();
        set({ isWatchingLocation: false });
      },

      /**
       * 근처 장소 로드
       * @async
       * @param {number} [radius=1000] - 검색 반경 (미터)
       * @returns {Promise<void>}
       * @description 현재 위치 기준 근처 장소를 검색
       */
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

      /**
       * 위치 기반 그룹 로드
       * @async
       * @param {number} [radius=2000] - 검색 반경 (미터)
       * @returns {Promise<void>}
       * @description 현재 위치 기준 근처 그룹을 검색
       */
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

      /**
       * 위치 기반 그룹 생성
       * @async
       * @param {Object} groupData - 그룹 데이터 (id, createdAt, memberCount 제외)
       * @returns {Promise<string | null>} 생성된 그룹 ID 또는 null
       * @description 현재 위치에 새로운 그룹을 생성
       */
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

      /**
       * 위치 기반 그룹 참여
       * @async
       * @param {string} groupId - 그룹 ID
       * @returns {Promise<boolean>} 성공 여부
       * @description 그룹 반경 내에 있을 때만 참여 가능
       */
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

      /**
       * 위치 기반 그룹 탈퇴
       * @async
       * @param {string} groupId - 그룹 ID
       * @returns {Promise<boolean>} 성공 여부
       * @description 현재 참여 중인 그룹에서 탈퇴
       */
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

      /**
       * 근처 사용자 로드
       * @async
       * @param {number} [radius=1000] - 검색 반경 (미터)
       * @returns {Promise<void>}
       * @description 개인정보 보호를 위해 제한적인 정보만 제공
       */
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

      /**
       * 두 지점 간 거리 계산
       * @param {number} lat1 - 첫 번째 지점의 위도
       * @param {number} lon1 - 첫 번째 지점의 경도
       * @param {number} lat2 - 두 번째 지점의 위도
       * @param {number} lon2 - 두 번째 지점의 경도
       * @returns {number} 거리 (미터)
       * @description Haversine 공식을 사용한 두 지점 간 거리 계산
       */
      calculateDistance: (lat1, lon1, lat2, lon2) => {
        return locationService.calculateDistance(lat1, lon1, lat2, lon2);
      },

      /**
       * 그룹 반경 내 위치 여부 확인
       * @param {string} groupId - 그룹 ID
       * @returns {boolean} 반경 내 위치 여부
       * @description 현재 위치가 특정 그룹의 참여 가능 반경 내에 있는지 확인
       */
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

      /**
       * 에러 메시지 설정
       * @param {string | null} error - 에러 메시지
       */
      setError: (error) => {
        set({ error });
      },

      /**
       * 위치 데이터 초기화
       * @description 모든 위치 관련 데이터를 초기화하고 서비스 정리
       */
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
      /** 저장소 키 이름 */
      name: 'location-storage',
      /** AsyncStorage를 사용하는 커스텀 저장소 */
      storage: createJSONStorage(() => AsyncStorage),
      /**
       * 영속화할 상태 선택
       * @description 위치 권한 상태만 저장, 위치 데이터는 보안상 제외
       */
      partialize: (state) => ({
        // 민감하지 않은 데이터만 persist
        locationPermissionGranted: state.locationPermissionGranted,
        // 위치 데이터는 보안상 persist하지 않음
      }),
    }
  )
);