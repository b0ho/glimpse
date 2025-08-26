import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
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
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <MaterialCommunityIcons 
              name={item.icon as any} 
              size={24} 
              color={COLORS.TEXT.PRIMARY} 
            />
            <Text style={styles.settingLabel}>{item.label}</Text>
          </View>
          <Switch
            value={item.value as boolean}
            onValueChange={item.action}
            trackColor={{ false: COLORS.BORDER, true: COLORS.PRIMARY }}
            thumbColor={item.value ? COLORS.PRIMARY : '#f4f3f4'}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.settingItem}
        onPress={() => {
          if (item.type === 'navigate' && item.route) {
            navigation.navigate(item.route as never);
          } else if (item.type === 'action' && item.action) {
            item.action();
          }
        }}
      >
        <View style={styles.settingLeft}>
          <MaterialCommunityIcons 
            name={item.icon as any} 
            size={24} 
            color={COLORS.TEXT.PRIMARY} 
          />
          <Text style={styles.settingLabel}>{item.label}</Text>
        </View>
        <View style={styles.settingRight}>
          {typeof item.value === 'string' && (
            <Text style={styles.settingValue}>{item.value}</Text>
          )}
          <MaterialCommunityIcons 
            name="chevron-right" 
            size={24} 
            color={COLORS.TEXT.SECONDARY} 
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.TEXT.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings:title')}</Text>
        <View style={styles.backButton} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {settingSections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <React.Fragment key={itemIndex}>
                  {renderSettingItem(item)}
                  {itemIndex < section.items.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('settings:footer.version')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: SPACING.LG,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.SECONDARY,
    marginHorizontal: SPACING.LG,
    marginBottom: SPACING.SM,
  },
  sectionContent: {
    backgroundColor: COLORS.SURFACE,
    marginHorizontal: SPACING.MD,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.MD,
  },
  settingLabel: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
  },
  settingValue: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    marginLeft: SPACING.MD + 24 + SPACING.MD,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.XL,
  },
  footerText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.LIGHT,
  },
});

export default ProfileSettingsScreen;