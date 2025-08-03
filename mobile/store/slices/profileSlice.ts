import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import profileService from '@/services/profile/profileService';
import { 
  User, 
  UpdateProfileData, 
  ProfileUpdateResponse,
  Like,
  FriendRequest,
  Match,
} from '@shared/types';

/**
 * 프로필 상태 관리 인터페이스
 * @interface ProfileState
 * @description 사용자 프로필, 받은 좋아요, 친구 요청, 매칭 관리
 */
interface ProfileState {
  /** 사용자 프로필 정보 */
  userProfile: User | null;
  /** 받은 좋아요 목록 */
  likesReceived: Like[];
  /** 친구 요청 목록 */
  friendRequests: FriendRequest[];
  /** 매칭 목록 */
  matches: Match[];
  /** 로딩 상태 */
  loading: boolean;
  /** 에러 메시지 */
  error: string | null;
  
  // Actions
  /** 사용자 프로필 조회 */
  fetchUserProfile: (userId: string) => Promise<void>;
  /** 프로필 업데이트 */
  updateProfile: (userId: string, data: UpdateProfileData) => Promise<ProfileUpdateResponse | null>;
  /** 프로필 이미지 업로드 */
  uploadProfileImage: (userId: string, imageUri: string) => Promise<string | null>;
  
  // Likes
  /** 받은 좋아요 목록 조회 (프리미엄) */
  fetchLikesReceived: () => Promise<void>;
  
  // Friend requests
  /** 친구 요청 목록 조회 */
  fetchFriendRequests: () => Promise<void>;
  /** 친구 요청 수락 */
  acceptFriendRequest: (requestId: string) => Promise<boolean>;
  /** 친구 요청 거절 */
  rejectFriendRequest: (requestId: string) => Promise<boolean>;
  
  // Matches
  /** 매칭 목록 조회 */
  fetchMatches: () => Promise<void>;
  
  // Utils
  /** 프로필 상태 초기화 */
  clearProfile: () => void;
}

/**
 * 프로필 상태 관리 스토어
 * @constant useProfileStore
 * @description 사용자 프로필, 친구 요청, 매칭 정보를 관리하는 Zustand 스토어
 * @example
 * ```typescript
 * const { userProfile, fetchUserProfile, updateProfile } = useProfileStore();
 * ```
 */
export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      /** 사용자 프로필 */
      userProfile: null,
      /** 받은 좋아요 목록 */
      likesReceived: [],
      /** 친구 요청 목록 */
      friendRequests: [],
      /** 매칭 목록 */
      matches: [],
      /** 로딩 상태 */
      loading: false,
      /** 에러 메시지 */
      error: null,

      /**
       * 사용자 프로필 조회
       * @async
       * @param {string} userId - 사용자 ID
       * @returns {Promise<void>}
       */
      fetchUserProfile: async (userId: string) => {
        set({ loading: true, error: null });
        try {
          const profile = await profileService.getUserProfile(userId);
          set({ userProfile: profile, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '프로필을 불러오는데 실패했습니다',
            loading: false 
          });
        }
      },

      /**
       * 프로필 업데이트
       * @async
       * @param {string} userId - 사용자 ID
       * @param {UpdateProfileData} data - 업데이트할 프로필 데이터
       * @returns {Promise<ProfileUpdateResponse | null>} 업데이트 결과
       */
      updateProfile: async (userId: string, data: UpdateProfileData) => {
        set({ loading: true, error: null });
        try {
          const response = await profileService.updateProfile(userId, data);
          if (response.success && response.data) {
            set({ 
              userProfile: response.data, 
              loading: false 
            });
            return response;
          }
          set({ 
            error: response.message || '프로필 업데이트에 실패했습니다',
            loading: false 
          });
          return null;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '프로필 업데이트에 실패했습니다',
            loading: false 
          });
          return null;
        }
      },

      /**
       * 프로필 이미지 업로드
       * @async
       * @param {string} userId - 사용자 ID
       * @param {string} imageUri - 이미지 URI
       * @returns {Promise<string | null>} 업로드된 이미지 URL
       */
      uploadProfileImage: async (userId: string, imageUri: string) => {
        set({ loading: true, error: null });
        try {
          const imageUrl = await profileService.uploadProfileImage(userId, imageUri);
          const currentProfile = get().userProfile;
          if (currentProfile) {
            set({ 
              userProfile: { ...currentProfile, profileImage: imageUrl },
              loading: false 
            });
          }
          return imageUrl;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '이미지 업로드에 실패했습니다',
            loading: false 
          });
          return null;
        }
      },

      /**
       * 받은 좋아요 목록 조회
       * @async
       * @returns {Promise<void>}
       * @description 프리미엄 사용자만 사용 가능
       */
      fetchLikesReceived: async () => {
        set({ loading: true, error: null });
        try {
          const likes = await profileService.getLikesReceived();
          set({ likesReceived: likes, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '좋아요 목록을 불러오는데 실패했습니다',
            loading: false 
          });
        }
      },

      /**
       * 친구 요청 목록 조회
       * @async
       * @returns {Promise<void>}
       */
      fetchFriendRequests: async () => {
        set({ loading: true, error: null });
        try {
          const requests = await profileService.getFriendRequests();
          set({ friendRequests: requests, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '친구 요청을 불러오는데 실패했습니다',
            loading: false 
          });
        }
      },

      /**
       * 친구 요청 수락
       * @async
       * @param {string} requestId - 친구 요청 ID
       * @returns {Promise<boolean>} 성공 여부
       */
      acceptFriendRequest: async (requestId: string): Promise<boolean> => {
        try {
          const success = await profileService.acceptFriendRequest(requestId);
          if (success) {
            const requests = get().friendRequests.filter(r => r.id !== requestId);
            set({ friendRequests: requests });
          }
          return success;
        } catch (error) {
          console.error('Failed to accept friend request:', error);
          return false;
        }
      },

      /**
       * 친구 요청 거절
       * @async
       * @param {string} requestId - 친구 요청 ID
       * @returns {Promise<boolean>} 성공 여부
       */
      rejectFriendRequest: async (requestId: string): Promise<boolean> => {
        try {
          const success = await profileService.rejectFriendRequest(requestId);
          if (success) {
            const requests = get().friendRequests.filter(r => r.id !== requestId);
            set({ friendRequests: requests });
          }
          return success;
        } catch (error) {
          console.error('Failed to reject friend request:', error);
          return false;
        }
      },

      /**
       * 매칭 목록 조회
       * @async
       * @returns {Promise<void>}
       * @description 서로 좋아요를 누른 매칭 목록 조회
       */
      fetchMatches: async () => {
        set({ loading: true, error: null });
        try {
          const matches = await profileService.getMatches();
          set({ matches, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '매칭 목록을 불러오는데 실패했습니다',
            loading: false 
          });
        }
      },

      /**
       * 프로필 상태 초기화
       * @description 모든 프로필 관련 데이터를 초기화
       */
      clearProfile: () => {
        set({ 
          userProfile: null,
          likesReceived: [],
          friendRequests: [],
          matches: [],
          loading: false,
          error: null 
        });
      },
    }),
    {
      /** 저장소 키 이름 */
      name: 'profile-storage',
      /** AsyncStorage를 사용하는 커스텀 저장소 */
      storage: {
        /**
         * 저장소에서 값 가져오기
         * @async
         * @param {string} name - 저장소 키
         * @returns {Promise<any>} 저장된 값
         */
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        /**
         * 저장소에 값 저장
         * @async
         * @param {string} name - 저장소 키
         * @param {any} value - 저장할 값
         */
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        /**
         * 저장소에서 값 제거
         * @async
         * @param {string} name - 저장소 키
         */
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);