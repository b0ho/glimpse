import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService, NotificationData } from '../../services/notifications/notification-service';

/**
 * 알림 설정 인터페이스
 * @interface NotificationSettings
 * @description 각 알림 타입별 활성화 설정
 */
export interface NotificationSettings {
  /** 새로운 매치 알림 */
  newMatches: boolean;
  /** 새 메시지 알림 */
  newMessages: boolean;
  /** 받은 좋아요 알림 (프리미엄 기능) */
  likesReceived: boolean;
  /** 슈퍼 좋아요 알림 */
  superLikes: boolean;
  /** 그룹 초대 알림 */
  groupInvites: boolean;
  /** 푸시 알림 전체 활성화 */
  pushEnabled: boolean;
}

/**
 * 알림 상태 인터페이스
 * @interface NotificationState
 * @description 알림 설정 및 토큰 관리 상태
 */
export interface NotificationState {
  /** 알림 설정 */
  settings: NotificationSettings;
  /** Expo 푸시 토큰 */
  expoPushToken: string | null;
  /** 초기화 완료 여부 */
  isInitialized: boolean;
  /** 대기 중인 알림 목록 */
  pendingNotifications: NotificationData[];
  
  // Actions
  /** 알림 시스템 초기화 */
  initializeNotifications: () => Promise<void>;
  /** 알림 설정 업데이트 */
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  /** 특정 알림 타입 토글 */
  toggleNotificationType: (type: keyof NotificationSettings) => Promise<void>;
  /** 설정 초기화 */
  resetSettings: () => Promise<void>;
  /** 대기 중 알림 추가 */
  addPendingNotification: (notification: NotificationData) => void;
  /** 대기 중 알림 초기화 */
  clearPendingNotifications: () => void;
  /** 테스트 알림 발송 */
  sendTestNotification: () => Promise<void>;
}

/**
 * 기본 알림 설정
 * @constant defaultSettings
 * @description 모든 알림이 활성화된 기본 설정
 */
const defaultSettings: NotificationSettings = {
  newMatches: true,
  newMessages: true,
  likesReceived: true,
  superLikes: true,
  groupInvites: true,
  pushEnabled: true,
};

/**
 * 알림 상태 관리 스토어
 * @constant useNotificationStore
 * @description 푸시 알림 설정 및 토큰을 관리하는 Zustand 스토어
 * @example
 * ```typescript
 * const { settings, toggleNotificationType, sendTestNotification } = useNotificationStore();
 * ```
 */
export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      /** 알림 설정 */
      settings: defaultSettings,
      /** Expo 푸시 토큰 */
      expoPushToken: null,
      /** 초기화 완료 여부 */
      isInitialized: false,
      /** 대기 중인 알림 목록 */
      pendingNotifications: [],

      /**
       * 알림 시스템 초기화
       * @async
       * @returns {Promise<void>}
       * @description Expo 푸시 토큰을 요청하고 저장
       */
      initializeNotifications: async () => {
        try {
          const token = await notificationService.getExpoPushToken();
          set({ 
            expoPushToken: token,
            isInitialized: true 
          });
          
          console.log('Notifications initialized with token:', token);
        } catch (error) {
          console.error('Failed to initialize notifications:', error);
          set({ isInitialized: true }); // Mark as initialized even if failed
        }
      },

      /**
       * 알림 설정 업데이트
       * @async
       * @param {Partial<NotificationSettings>} newSettings - 업데이트할 설정
       * @returns {Promise<void>}
       * @description 알림 설정을 업데이트하고 필요시 예약된 알림 취소
       */
      updateSettings: async (newSettings: Partial<NotificationSettings>) => {
        const currentSettings = get().settings;
        const updatedSettings = { ...currentSettings, ...newSettings };
        
        set({ settings: updatedSettings });
        
        // If push notifications are disabled, cancel all scheduled notifications
        if (!updatedSettings.pushEnabled) {
          await notificationService.cancelAllNotifications();
        }
        
        console.log('Notification settings updated:', updatedSettings);
      },

      /**
       * 특정 알림 타입 토글
       * @async
       * @param {keyof NotificationSettings} type - 토글할 알림 타입
       * @returns {Promise<void>}
       * @description 특정 알림 타입을 켜거나 끄고 관련 알림 취소
       */
      toggleNotificationType: async (type: keyof NotificationSettings) => {
        const currentSettings = get().settings;
        const newValue = !currentSettings[type];
        
        await get().updateSettings({ [type]: newValue });
        
        // If disabling a specific type, cancel related notifications
        if (!newValue) {
          switch (type) {
            case 'newMatches':
              await notificationService.cancelNotificationsByType('new_match');
              break;
            case 'newMessages':
              await notificationService.cancelNotificationsByType('new_message');
              break;
            case 'likesReceived':
              await notificationService.cancelNotificationsByType('like_received');
              break;
            case 'superLikes':
              await notificationService.cancelNotificationsByType('super_like');
              break;
            case 'groupInvites':
              await notificationService.cancelNotificationsByType('group_invite');
              break;
          }
        }
      },

      /**
       * 설정 초기화
       * @async
       * @returns {Promise<void>}
       * @description 모든 알림을 취소하고 기본 설정으로 초기화
       * @throws {Error} 초기화 실패 시
       */
      resetSettings: async () => {
        try {
          // Cancel all existing notifications
          await notificationService.cancelAllNotifications();
          
          // Reset to default settings
          set({ settings: defaultSettings });
          
          console.log('Notification settings reset to default');
        } catch (error) {
          console.error('Failed to reset notification settings:', error);
          throw error;
        }
      },

      /**
       * 대기 중 알림 추가
       * @param {NotificationData} notification - 추가할 알림 데이터
       * @description 나중에 처리할 알림을 대기 리스트에 추가
       */
      addPendingNotification: (notification: NotificationData) => {
        set(state => ({
          pendingNotifications: [...state.pendingNotifications, notification]
        }));
      },

      /**
       * 대기 중 알림 초기화
       * @description 모든 대기 중인 알림을 제거
       */
      clearPendingNotifications: () => {
        set({ pendingNotifications: [] });
      },

      /**
       * 테스트 알림 발송
       * @async
       * @returns {Promise<void>}
       * @description 알림 설정 테스트를 위한 테스트 알림 발송
       */
      sendTestNotification: async () => {
        const { settings } = get();
        if (!settings.pushEnabled) {
          console.log('Push notifications are disabled');
          return;
        }

        await notificationService.schedulePushNotification({
          type: 'new_match',
          title: '🧪 테스트 알림',
          body: 'Glimpse 알림이 정상적으로 작동하고 있습니다!',
        });
      },
    }),
    {
      /** 저장소 키 이름 */
      name: 'notification-storage',
      /** AsyncStorage를 사용하는 커스텀 저장소 */
      storage: createJSONStorage(() => AsyncStorage),
      /**
       * 영속화할 상태 선택
       * @description 알림 설정과 푸시 토큰만 저장
       */
      partialize: (state) => ({
        settings: state.settings,
        expoPushToken: state.expoPushToken,
      }),
    }
  )
);