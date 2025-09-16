import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useProfileStore } from '@/store/slices/profileSlice';
import profileService from '@/services/profile/profileService';

interface SettingSection {
  title: string;
  items: SettingItem[];
}

interface SettingItem {
  icon: string;
  label: string;
  value?: string | boolean;
  type: 'navigate' | 'toggle' | 'action';
  action?: () => void;
  route?: string;
}

const ProfileSettingsScreen = () => {
  const { t } = useAndroidSafeTranslation('settings');
  const navigation = useNavigation();
  const { userProfile } = useProfileStore();
  
  const [privacySettings, setPrivacySettings] = useState({
    showProfile: userProfile?.privacySettings?.showProfile ?? true,
    showOnlineStatus: userProfile?.privacySettings?.showOnlineStatus ?? true,
    showLastSeen: userProfile?.privacySettings?.showLastSeen ?? true,
    allowFriendRequests: userProfile?.privacySettings?.allowFriendRequests ?? true,
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    likes: userProfile?.notificationSettings?.likes ?? true,
    matches: userProfile?.notificationSettings?.matches ?? true,
    messages: userProfile?.notificationSettings?.messages ?? true,
    friendRequests: userProfile?.notificationSettings?.friendRequests ?? true,
  });

  const handlePrivacyToggle = async (key: keyof typeof privacySettings) => {
    const newSettings = {
      ...privacySettings,
      [key]: !privacySettings[key],
    };
    setPrivacySettings(newSettings);
    
    const success = await profileService.updatePrivacySettings(newSettings);
    if (!success) {
      // Revert on failure
      setPrivacySettings(privacySettings);
      Alert.alert(t('common:status.error'), t('settings:settingUpdateFailed'));
    }
  };

  const handleNotificationToggle = async (key: keyof typeof notificationSettings) => {
    const newSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key],
    };
    setNotificationSettings(newSettings);
    
    const success = await profileService.updateNotificationSettings(newSettings);
    if (!success) {
      // Revert on failure
      setNotificationSettings(notificationSettings);
      Alert.alert(t('common:status.error'), t('settings:settingUpdateFailed'));
    }
  };

  const settingSections: SettingSection[] = [
    {
      title: t('settings:accountSettings.title'),
      items: [
        {
          icon: 'account-edit',
          label: t('settings:accountSettings.editProfile'),
          type: 'navigate',
          route: 'ProfileEdit',
        },
        {
          icon: 'lock-reset',
          label: t('settings:accountSettings.changePassword'),
          type: 'navigate',
          route: 'ChangePassword',
        },
        // Email change removed - not in User type
        {
          icon: 'phone-outline',
          label: t('settings:accountSettings.changePhone'),
          value: userProfile?.phoneNumber || t('settings:accountSettings.notRegistered'),
          type: 'navigate',
          route: 'ChangePhone',
        },
      ],
    },
    {
      title: t('settings:privacySettings.title'),
      items: [
        {
          icon: 'eye-outline',
          label: t('settings:privacySettings.showProfile'),
          value: privacySettings.showProfile,
          type: 'toggle',
          action: () => handlePrivacyToggle('showProfile'),
        },
        {
          icon: 'circle-outline',
          label: t('settings:privacySettings.showOnlineStatus'),
          value: privacySettings.showOnlineStatus,
          type: 'toggle',
          action: () => handlePrivacyToggle('showOnlineStatus'),
        },
        {
          icon: 'clock-outline',
          label: t('settings:privacySettings.showLastSeen'),
          value: privacySettings.showLastSeen,
          type: 'toggle',
          action: () => handlePrivacyToggle('showLastSeen'),
        },
        {
          icon: 'account-plus-outline',
          label: t('settings:privacySettings.allowFriendRequests'),
          value: privacySettings.allowFriendRequests,
          type: 'toggle',
          action: () => handlePrivacyToggle('allowFriendRequests'),
        },
        {
          icon: 'account-cancel-outline',
          label: t('settings:privacySettings.blockedUsers'),
          type: 'navigate',
          route: 'BlockedUsers',
        },
      ],
    },
    {
      title: t('settings:notificationSettings.title'),
      items: [
        {
          icon: 'heart-outline',
          label: t('settings:notificationSettings.likes'),
          value: notificationSettings.likes,
          type: 'toggle',
          action: () => handleNotificationToggle('likes'),
        },
        {
          icon: 'account-check-outline',
          label: t('settings:notificationSettings.matches'),
          value: notificationSettings.matches,
          type: 'toggle',
          action: () => handleNotificationToggle('matches'),
        },
        {
          icon: 'message-outline',
          label: t('settings:notificationSettings.messages'),
          value: notificationSettings.messages,
          type: 'toggle',
          action: () => handleNotificationToggle('messages'),
        },
        {
          icon: 'account-multiple-plus-outline',
          label: t('settings:notificationSettings.friendRequests'),
          value: notificationSettings.friendRequests,
          type: 'toggle',
          action: () => handleNotificationToggle('friendRequests'),
        },
      ],
    },
    {
      title: t('settings:otherSettings.title'),
      items: [
        {
          icon: 'file-document-outline',
          label: t('settings:otherSettings.terms'),
          type: 'navigate',
          route: 'Terms',
        },
        {
          icon: 'shield-lock-outline',
          label: t('settings:otherSettings.privacy'),
          type: 'navigate',
          route: 'Privacy',
        },
        {
          icon: 'help-circle-outline',
          label: t('settings:otherSettings.support'),
          type: 'navigate',
          route: 'Support',
        },
        {
          icon: 'information-outline',
          label: t('settings:otherSettings.appInfo'),
          type: 'navigate',
          route: 'AppInfo',
        },
        {
          icon: 'account-remove-outline',
          label: t('settings:otherSettings.deleteAccount'),
          type: 'action',
          action: () => {
            Alert.alert(
              t('settings:deleteAccount.title'),
              t('settings:deleteAccount.message'),
              [
                { text: t('settings:deleteAccount.cancel'), style: 'cancel' },
                {
                  text: t('settings:deleteAccount.confirm'),
                  style: 'destructive',
                  onPress: () => navigation.navigate('DeleteAccount' as never),
                },
              ]
            );
          },
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    if (item.type === 'toggle') {
      return (
        <View className="flex-row items-center justify-between px-4 py-4">
          <View className="flex-row items-center flex-1 gap-4">
            <MaterialCommunityIcons 
              name={item.icon as any} 
              size={24} 
              className="text-gray-900 dark:text-white"
            />
            <Text className="text-gray-900 dark:text-white text-base flex-1">{item.label}</Text>
          </View>
          <Switch
            value={item.value as boolean}
            onValueChange={item.action}
            trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
            thumbColor={item.value ? '#3B82F6' : '#F3F4F6'}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        className="flex-row items-center justify-between px-4 py-4"
        onPress={() => {
          if (item.type === 'navigate' && item.route) {
            navigation.navigate(item.route as never);
          } else if (item.type === 'action' && item.action) {
            item.action();
          }
        }}
      >
        <View className="flex-row items-center flex-1 gap-4">
          <MaterialCommunityIcons 
            name={item.icon as any} 
            size={24} 
            className="text-gray-900 dark:text-white"
          />
          <Text className="text-gray-900 dark:text-white text-base flex-1">{item.label}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          {typeof item.value === 'string' && (
            <Text className="text-gray-600 dark:text-gray-400 text-sm">{item.value}</Text>
          )}
          <MaterialCommunityIcons 
            name="chevron-right" 
            size={24} 
            className="text-gray-600 dark:text-gray-400"
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-row items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 justify-center"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} className="text-gray-900 dark:text-white" />
        </TouchableOpacity>
        <Text className="text-gray-900 dark:text-white text-xl font-bold">{t('settings:title')}</Text>
        <View className="w-10" />
      </View>
      
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {settingSections.map((section, index) => (
          <View key={index} className="mt-6">
            <Text className="text-gray-600 dark:text-gray-400 text-base font-semibold px-6 mb-3">{section.title}</Text>
            <View className="bg-white dark:bg-gray-800 mx-4 rounded-xl overflow-hidden">
              {section.items.map((item, itemIndex) => (
                <React.Fragment key={itemIndex}>
                  {renderSettingItem(item)}
                  {itemIndex < section.items.length - 1 && (
                    <View className="h-px bg-gray-200 dark:bg-gray-700 ml-16" />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}
        
        <View className="items-center py-8">
          <Text className="text-gray-500 dark:text-gray-500 text-sm">{t('settings:footer.version')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileSettingsScreen;