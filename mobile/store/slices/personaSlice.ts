import { create, persist, createJSONStorage } from '../zustandCompat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/services/api/config';

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

interface NearbyPersona {
  userId: string;
  anonymousId: string;
  persona: Persona;
  distance: number;
  lastActive: string;
}

interface PersonaState {
  myPersona: Persona | null;
  nearbyPersonas: NearbyPersona[];
  locationSharingEnabled: boolean;
  lastLocationUpdate: Date | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMyPersona: () => Promise<void>;
  createOrUpdatePersona: (data: Partial<Persona>) => Promise<void>;
  togglePersona: (isActive: boolean) => Promise<void>;
  deletePersona: () => Promise<void>;
  updateLocation: (latitude: number, longitude: number) => Promise<void>;
  fetchNearbyPersonas: (latitude: number, longitude: number, radiusKm?: number) => Promise<void>;
  setLocationSharing: (enabled: boolean) => void;
  clearError: () => void;
}

export const usePersonaStore = create<PersonaState>()(
  persist(
    (set, get) => ({
      myPersona: null,
      nearbyPersonas: [],
      locationSharingEnabled: false,
      lastLocationUpdate: null,
      isLoading: false,
      error: null,

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

      setLocationSharing: (enabled) => {
        set({ locationSharingEnabled: enabled });
      },

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