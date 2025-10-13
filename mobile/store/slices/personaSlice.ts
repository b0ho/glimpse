/**
 * 페르소나 상태 관리 Zustand 슬라이스
 * @module personaSlice
 * @description 익명 페르소나 생성, 관리, 위치 공유 기능
 */

import { create, persist, createJSONStorage } from '../zustandCompat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/services/api/config';

/**
 * 페르소나 인터페이스
 * @interface Persona
 * @description 사용자의 익명 페르소나 정보
 */
interface Persona {
  id: string;
  userId: string;
  nickname: string;
  age?: number;
  bio?: string;
  interests?: string[];
  occupation?: string;
  height?: number;
  mbti?: string;
  drinking?: string;
  smoking?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 근처 페르소나 인터페이스
 * @interface NearbyPersona
 * @description 주변에 있는 익명 사용자 정보
 */
interface NearbyPersona {
  /** 사용자 ID */
  userId: string;
  /** 익명 ID */
  anonymousId: string;
  /** 페르소나 정보 */
  persona: Persona;
  /** 거리 (미터) */
  distance: number;
  /** 마지막 활동 시간 */
  lastActive: string;
}

/**
 * 페르소나 상태 인터페이스
 * @interface PersonaState
 * @description 페르소나 및 위치 공유 상태 정보
 */
interface PersonaState {
  myPersona: Persona | null;
  nearbyPersonas: NearbyPersona[];
  locationSharingEnabled: boolean;
  lastLocationUpdate: Date | null;
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;

  // Actions
  /** 내 페르소나 조회 */
  fetchMyPersona: () => Promise<void>;
  /** 페르소나 생성 또는 업데이트 */
  createOrUpdatePersona: (data: Partial<Persona>) => Promise<void>;
  /** 내 페르소나 업데이트 (로컬) */
  updateMyPersona: (updates: Partial<Persona>) => void;
  /** 페르소나 활성화 토글 */
  togglePersona: (isActive: boolean) => Promise<void>;
  /** 페르소나 삭제 */
  deletePersona: () => Promise<void>;
  /** 위치 업데이트 */
  updateLocation: (latitude: number, longitude: number) => Promise<void>;
  /** 근처 페르소나 조회 */
  fetchNearbyPersonas: (latitude: number, longitude: number, radiusKm?: number) => Promise<void>;
  /** 위치 공유 설정 */
  setLocationSharing: (enabled: boolean) => void;
  /** 에러 초기화 */
  clearError: () => void;
}

/**
 * 페르소나 상태 관리 스토어
 * @constant usePersonaStore
 * @description 익명 페르소나 생성, 관리, 위치 기반 매칭을 관리하는 Zustand 스토어
 * @example
 * ```typescript
 * const { myPersona, createOrUpdatePersona, nearbyPersonas } = usePersonaStore();
 * ```
 */
export const usePersonaStore = create<PersonaState>()(
  persist(
    (set, get) => ({
      /** 내 페르소나 정보 */
      myPersona: null,
      /** 근처 페르소나 목록 */
      nearbyPersonas: [],
      /** 위치 공유 활성화 여부 */
      locationSharingEnabled: false,
      /** 마지막 위치 업데이트 시간 */
      lastLocationUpdate: null,
      /** 로딩 상태 */
      isLoading: false,
      /** 에러 메시지 */
      error: null,

      /**
       * 내 페르소나 조회
       * @async
       * @returns {Promise<void>}
       * @description 서버에서 현재 사용자의 페르소나 정보를 가져옴
       */
      fetchMyPersona: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.get<{ success: boolean; data: Persona }>('/persona/me');
          if (response.success && response.data) {
            set({ myPersona: response.data, isLoading: false });
          } else {
            set({ myPersona: null, isLoading: false });
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to fetch persona', isLoading: false });
        }
      },

      /**
       * 페르소나 생성 또는 업데이트
       * @async
       * @param {Partial<Persona>} data - 생성/업데이트할 페르소나 데이터
       * @returns {Promise<void>}
       * @description API 호출 실패 시 로컬에 저장 (개발 모드)
       */
      createOrUpdatePersona: async (data) => {
        set({ isLoading: true, error: null });
        try {
          // API 호출 시도
          const response = await apiClient.post<{ success: boolean; data: Persona }>('/persona', data);
          if (response.success && response.data) {
            set({ myPersona: response.data, isLoading: false });
          }
        } catch (error: any) {
          // API 호출 실패 시 로컬 저장 (개발 모드)
          console.log('API 호출 실패, 로컬에 저장:', error.message);
          const currentPersona = get().myPersona;
          const newPersona: Persona = {
            id: currentPersona?.id || `persona_${Date.now()}`,
            userId: 'current_user',
            nickname: data.nickname || currentPersona?.nickname || '',
            age: data.age !== undefined ? data.age : currentPersona?.age,
            bio: data.bio !== undefined ? data.bio : currentPersona?.bio,
            interests: data.interests !== undefined ? data.interests : currentPersona?.interests,
            occupation: data.occupation !== undefined ? data.occupation : currentPersona?.occupation,
            height: data.height !== undefined ? data.height : currentPersona?.height,
            mbti: data.mbti !== undefined ? data.mbti : currentPersona?.mbti,
            drinking: data.drinking !== undefined ? data.drinking : currentPersona?.drinking,
            smoking: data.smoking !== undefined ? data.smoking : currentPersona?.smoking,
            isActive: data.isActive !== undefined ? data.isActive : currentPersona?.isActive || true,
            createdAt: currentPersona?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set({ myPersona: newPersona, isLoading: false });
          // 로컬 저장만 하고 에러는 throw하지 않음
        }
      },

      /**
       * 내 페르소나 업데이트 (로컬)
       * @param {Partial<Persona>} updates - 업데이트할 페르소나 정보
       * @description 로컬 페르소나 정보를 즉시 업데이트
       */
      updateMyPersona: (updates) => {
        const currentPersona = get().myPersona;
        if (currentPersona) {
          set({ myPersona: { ...currentPersona, ...updates } });
        }
      },

      /**
       * 페르소나 활성화 토글
       * @async
       * @param {boolean} isActive - 활성화 여부
       * @returns {Promise<void>}
       * @description 페르소나 활성화 상태를 변경
       */
      togglePersona: async (isActive) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.put<{ success: boolean; data: Persona }>('/persona/toggle', { isActive });
          if (response.success && response.data) {
            set({ myPersona: response.data, isLoading: false });
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to toggle persona', isLoading: false });
        }
      },

      /**
       * 페르소나 삭제
       * @async
       * @returns {Promise<void>}
       * @description 현재 페르소나를 완전히 삭제
       */
      deletePersona: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.delete<{ success: boolean }>('/persona');
          if (response.success) {
            set({ myPersona: null, isLoading: false });
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to delete persona', isLoading: false });
        }
      },

      /**
       * 위치 업데이트
       * @async
       * @param {number} latitude - 위도
       * @param {number} longitude - 경도
       * @returns {Promise<void>}
       * @description 현재 위치를 서버에 업데이트 (위치 공유 활성화 시)
       */
      updateLocation: async (latitude, longitude) => {
        try {
          const locationSharingEnabled = get().locationSharingEnabled;
          await apiClient.post('/persona/location', {
            latitude,
            longitude,
            locationSharingEnabled,
          });
          set({ lastLocationUpdate: new Date() });
        } catch (error: any) {
          console.error('Failed to update location:', error);
        }
      },

      /**
       * 근처 페르소나 조회
       * @async
       * @param {number} latitude - 위도
       * @param {number} longitude - 경도
       * @param {number} [radiusKm=5] - 검색 반경 (km)
       * @returns {Promise<void>}
       * @description 주변의 익명 사용자 페르소나 목록을 조회
       */
      fetchNearbyPersonas: async (latitude, longitude, radiusKm = 5) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.get<{ success: boolean; data: NearbyPersona[] }>(
            '/persona/nearby',
            { latitude, longitude, radiusKm }
          );
          if (response.success && response.data) {
            set({ nearbyPersonas: response.data, isLoading: false });
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to fetch nearby personas', isLoading: false });
        }
      },

      /**
       * 위치 공유 설정
       * @param {boolean} enabled - 위치 공유 활성화 여부
       * @description 위치 공유를 켜거나 끔
       */
      setLocationSharing: (enabled) => {
        set({ locationSharingEnabled: enabled });
      },

      /**
       * 에러 초기화
       * @description 에러 메시지를 초기화
       */
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'persona-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        myPersona: state.myPersona,
        locationSharingEnabled: state.locationSharingEnabled,
        lastLocationUpdate: state.lastLocationUpdate,
      }),
    }
  )
);