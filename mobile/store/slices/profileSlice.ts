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

interface ProfileState {
  userProfile: User | null;
  likesReceived: Like[];
  friendRequests: FriendRequest[];
  matches: Match[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchUserProfile: (userId: string) => Promise<void>;
  updateProfile: (userId: string, data: UpdateProfileData) => Promise<ProfileUpdateResponse | null>;
  uploadProfileImage: (userId: string, imageUri: string) => Promise<string | null>;
  
  // Likes
  fetchLikesReceived: () => Promise<void>;
  
  // Friend requests
  fetchFriendRequests: () => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<boolean>;
  rejectFriendRequest: (requestId: string) => Promise<boolean>;
  
  // Matches
  fetchMatches: () => Promise<void>;
  
  // Utils
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      userProfile: null,
      likesReceived: [],
      friendRequests: [],
      matches: [],
      loading: false,
      error: null,

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

      acceptFriendRequest: async (requestId: string) => {
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

      rejectFriendRequest: async (requestId: string) => {
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
      name: 'profile-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);