/**
 * 즉석 미팅 상태 관리 Zustand 스토어
 * @module instantMeetingStore
 * @description 즉석 미팅 참여, 특징 입력, 매칭 관리
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 참가자 특징 인터페이스
 * @interface Features
 * @description 참가자의 외모 특징 정보
 */
interface Features {
  /** 상의 특징 (색상, 스타일 등) */
  upperWear?: string;
  /** 하의 특징 (색상, 스타일 등) */
  lowerWear?: string;
  /** 안경 착용 여부 */
  glasses?: boolean | null;
  /** 특별한 특징 (모자, 액세서리 등) */
  specialFeatures?: string;
}

/**
 * 참가자 특징 정보
 * @interface ParticipantFeatures
 * @description 자신의 특징과 찾고 있는 상대방의 특징
 */
interface ParticipantFeatures {
  /** 내 특징 */
  myFeatures: Features;
  /** 찾고 있는 상대방의 특징 */
  lookingForFeatures: Features;
}

/**
 * 즉석 미팅 정보
 * @interface InstantMeeting
 * @description 현재 참여 중인 즉석 미팅 정보
 */
interface InstantMeeting {
  /** 미팅 ID */
  id: string;
  /** 미팅 참여 코드 */
  code: string;
  /** 미팅 이름 */
  name: string;
  /** 활성화된 특징 카테고리 목록 */
  featureCategories: string[];
  /** 미팅 만료 시간 */
  expiresAt: string;
}

/**
 * 즉석 미팅 참가자
 * @interface InstantParticipant
 * @description 현재 미팅 참가자 정보
 */
interface InstantParticipant {
  /** 참가자 ID */
  id: string;
  /** 참가자 닉네임 */
  nickname: string;
}

/**
 * 즉석 매칭 정보
 * @interface InstantMatch
 * @description 즉석 미팅에서 매칭된 상대방 정보
 */
interface InstantMatch {
  /** 매칭 ID */
  id: string;
  /** 상대방 닉네임 */
  nickname: string;
  /** 채팅방 ID */
  chatRoomId: string;
  /** 매칭 시간 */
  matchedAt: string;
  /** 마지막 메시지 미리보기 */
  lastMessage?: string;
}

/**
 * 즉석 미팅 스토어 인터페이스
 * @interface InstantMeetingStore
 * @description 즉석 미팅 상태 및 액션 관리
 */
interface InstantMeetingStore {
  // State
  /** 현재 참여 중인 미팅 */
  currentMeeting: InstantMeeting | null;
  /** 현재 참가자 정보 */
  currentParticipant: InstantParticipant | null;
  /** 미팅 참가자 수 */
  participantCount: number;
  /** 내 통계 정보 */
  myStats: {
    /** 매칭 수 */
    matches: number;
  };
  /** 매칭 목록 */
  matches: InstantMatch[];

  // Actions
  /** 특징 정보와 함께 미팅 참여 */
  joinMeetingWithFeatures: (code: string, nickname: string, features: ParticipantFeatures) => Promise<void>;
  /** 특징 정보 업데이트 */
  updateFeatures: (features: ParticipantFeatures) => Promise<void>;
  /** 미팅 상세 정보 조회 */
  fetchMeetingDetails: (meetingId: string) => Promise<void>;
  /** 매칭 목록 조회 */
  fetchMatches: () => Promise<void>;
  /** 즉석 미팅 나가기 */
  leaveInstantMeeting: () => Promise<void>;
  /** 상태 초기화 */
  reset: () => void;
}

/**
 * 즉석 미팅 상태 관리 스토어
 * @constant useInstantMeetingStore
 * @description 즉석 미팅 참여, 특징 입력, 매칭을 관리하는 Zustand 스토어
 * @example
 * ```typescript
 * const { joinMeetingWithFeatures, currentMeeting, matches } = useInstantMeetingStore();
 * ```
 */
export const useInstantMeetingStore = create<InstantMeetingStore>()(
  persist(
    (set, get) => ({
      // Initial state
      /** 현재 미팅 정보 */
      currentMeeting: null,
      /** 현재 참가자 정보 */
      currentParticipant: null,
      /** 참가자 수 */
      participantCount: 0,
      /** 내 통계 */
      myStats: {
        matches: 0,
      },
      /** 매칭 목록 */
      matches: [],

      /**
       * 특징 정보와 함께 미팅 참여
       * @async
       * @param {string} code - 미팅 참여 코드
       * @param {string} nickname - 사용할 닉네임
       * @param {ParticipantFeatures} features - 나와 찾는 상대방의 특징
       * @returns {Promise<void>}
       * @description 즉석 미팅에 참여하고 특징 정보를 등록
       * @throws {Error} 미팅 참여 실패 시
       */
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

      /**
       * 특징 정보 업데이트
       * @async
       * @param {ParticipantFeatures} features - 업데이트할 특징 정보
       * @returns {Promise<void>}
       * @description 자신과 찾는 상대방의 특징 정보를 업데이트
       * @throws {Error} 업데이트 실패 시
       */
      updateFeatures: async (features: ParticipantFeatures) => {
        try {
          // TODO: API call to update features
          console.log('Updating features:', features);
        } catch (error) {
          console.error('Failed to update features:', error);
          throw error;
        }
      },

      /**
       * 미팅 상세 정보 조회
       * @async
       * @param {string} meetingId - 미팅 ID
       * @returns {Promise<void>}
       * @description 미팅 참가자 수, 통계 등 상세 정보 조회
       */
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

      /**
       * 매칭 목록 조회
       * @async
       * @returns {Promise<void>}
       * @description 현재 미팅에서 발생한 매칭 목록 조회
       */
      fetchMatches: async () => {
        try {
          // TODO: API call to fetch matches
          const matches: InstantMatch[] = [];
          set({ matches });
        } catch (error) {
          console.error('Failed to fetch matches:', error);
        }
      },

      /**
       * 즉석 미팅 나가기
       * @async
       * @returns {Promise<void>}
       * @description 현재 참여 중인 미팅에서 나가고 상태 초기화
       * @throws {Error} 미팅 나가기 실패 시
       */
      leaveInstantMeeting: async () => {
        try {
          // TODO: API call to leave meeting
          get().reset();
        } catch (error) {
          console.error('Failed to leave meeting:', error);
          throw error;
        }
      },

      /**
       * 상태 초기화
       * @description 모든 즉석 미팅 상태를 초기값으로 리셋
       */
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
      /** 저장소 키 이름 */
      name: 'instant-meeting-storage',
      /** AsyncStorage를 사용하는 커스텀 저장소 */
      storage: createJSONStorage(() => AsyncStorage),
      /**
       * 영속화할 상태 선택
       * @description 현재 미팅과 참가자 정보만 저장
       */
      partialize: (state) => ({
        currentMeeting: state.currentMeeting,
        currentParticipant: state.currentParticipant,
      }),
    }
  )
);