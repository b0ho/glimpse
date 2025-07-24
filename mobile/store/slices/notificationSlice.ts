import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService, NotificationData } from '../../services/notifications/notification-service';

export interface NotificationSettings {
  newMatches: boolean;
  newMessages: boolean;
  likesReceived: boolean; // 프리미엄 기능
  superLikes: boolean;
  groupInvites: boolean;
  pushEnabled: boolean;
}

export interface NotificationState {
  settings: NotificationSettings;
  expoPushToken: string | null;
  isInitialized: boolean;
  pendingNotifications: NotificationData[];
  
  // Actions
  initializeNotifications: () => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  toggleNotificationType: (type: keyof NotificationSettings) => Promise<void>;
  resetSettings: () => Promise<void>;
  addPendingNotification: (notification: NotificationData) => void;
  clearPendingNotifications: () => void;
  sendTestNotification: () => Promise<void>;
}

const defaultSettings: NotificationSettings = {
  newMatches: true,
  newMessages: true,
  likesReceived: true,
  superLikes: true,
  groupInvites: true,
  pushEnabled: true,
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      expoPushToken: null,
      isInitialized: false,
      pendingNotifications: [],

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

      addPendingNotification: (notification: NotificationData) => {
        set(state => ({
          pendingNotifications: [...state.pendingNotifications, notification]
        }));
      },

      clearPendingNotifications: () => {
        set({ pendingNotifications: [] });
      },

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
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        expoPushToken: state.expoPushToken,
      }),
    }
  )
);