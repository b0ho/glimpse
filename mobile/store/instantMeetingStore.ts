import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Features {
  upperWear?: string;
  lowerWear?: string;
  glasses?: boolean | null;
  specialFeatures?: string;
}

interface ParticipantFeatures {
  myFeatures: Features;
  lookingForFeatures: Features;
}

interface InstantMeeting {
  id: string;
  code: string;
  name: string;
  featureCategories: string[];
  expiresAt: string;
}

interface InstantParticipant {
  id: string;
  nickname: string;
}

interface InstantMatch {
  id: string;
  nickname: string;
  chatRoomId: string;
  matchedAt: string;
  lastMessage?: string;
}

interface InstantMeetingStore {
  // State
  currentMeeting: InstantMeeting | null;
  currentParticipant: InstantParticipant | null;
  participantCount: number;
  myStats: {
    matches: number;
  };
  matches: InstantMatch[];

  // Actions
  joinMeetingWithFeatures: (code: string, nickname: string, features: ParticipantFeatures) => Promise<void>;
  updateFeatures: (features: ParticipantFeatures) => Promise<void>;
  fetchMeetingDetails: (meetingId: string) => Promise<void>;
  fetchMatches: () => Promise<void>;
  leaveInstantMeeting: () => Promise<void>;
  reset: () => void;
}

export const useInstantMeetingStore = create<InstantMeetingStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentMeeting: null,
      currentParticipant: null,
      participantCount: 0,
      myStats: {
        matches: 0,
      },
      matches: [],

      // Join meeting with features
      joinMeetingWithFeatures: async (code: string, nickname: string, features: ParticipantFeatures) => {
        try {
          // TODO: API call to join meeting
          const response = {
            meeting: {
              id: 'meeting-1',
              code,
              name: 'Test Meeting',
              featureCategories: ['upperWear', 'lowerWear', 'glasses'],
              expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
            },
            participant: {
              id: 'participant-1',
              nickname,
            },
          };

          set({
            currentMeeting: response.meeting,
            currentParticipant: response.participant,
          });
        } catch (error) {
          console.error('Failed to join meeting:', error);
          throw error;
        }
      },

      // Update features
      updateFeatures: async (features: ParticipantFeatures) => {
        try {
          // TODO: API call to update features
          console.log('Updating features:', features);
        } catch (error) {
          console.error('Failed to update features:', error);
          throw error;
        }
      },

      // Fetch meeting details
      fetchMeetingDetails: async (meetingId: string) => {
        try {
          // TODO: API call to fetch meeting details
          set({
            participantCount: 12,
            myStats: {
              matches: 0,
            },
          });
        } catch (error) {
          console.error('Failed to fetch meeting details:', error);
        }
      },

      // Fetch matches
      fetchMatches: async () => {
        try {
          // TODO: API call to fetch matches
          const matches: InstantMatch[] = [];
          set({ matches });
        } catch (error) {
          console.error('Failed to fetch matches:', error);
        }
      },

      // Leave meeting
      leaveInstantMeeting: async () => {
        try {
          // TODO: API call to leave meeting
          get().reset();
        } catch (error) {
          console.error('Failed to leave meeting:', error);
          throw error;
        }
      },

      // Reset store
      reset: () => {
        set({
          currentMeeting: null,
          currentParticipant: null,
          participantCount: 0,
          myStats: {
            matches: 0,
          },
          matches: [],
        });
      },
    }),
    {
      name: 'instant-meeting-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentMeeting: state.currentMeeting,
        currentParticipant: state.currentParticipant,
      }),
    }
  )
);