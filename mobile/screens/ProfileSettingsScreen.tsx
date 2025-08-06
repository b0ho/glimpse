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

const ProfileSettingsScreen= () => () => {
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
      Alert.alert('오류', '설정 변경에 실패했습니다.');
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
      Alert.alert('오류', '설정 변경에 실패했습니다.');
    }
  };

  const settingSections: SettingSection[] = [
    {
      title: '계정 설정',
      items: [
        {
          icon: 'account-edit',
          label: '프로필 수정',
          type: 'navigate',
          route: 'ProfileEdit',
        },
        {
          icon: 'lock-reset',
          label: '비밀번호 변경',
          type: 'navigate',
          route: 'ChangePassword',
        },
        // Email change removed - not in User type
        {
          icon: 'phone-outline',
          label: '전화번호 변경',
          value: userProfile?.phoneNumber || '미등록',
          type: 'navigate',
          route: 'ChangePhone',
        },
      ],
    },
    {
      title: '개인정보 보호',
      items: [
        {
          icon: 'eye-outline',
          label: '프로필 공개',
          value: privacySettings.showProfile,
          type: 'toggle',
          action: () => handlePrivacyToggle('showProfile'),
        },
        {
          icon: 'circle-outline',
          label: '온라인 상태 표시',
          value: privacySettings.showOnlineStatus,
          type: 'toggle',
          action: () => handlePrivacyToggle('showOnlineStatus'),
        },
        {
          icon: 'clock-outline',
          label: '마지막 접속 시간 표시',
          value: privacySettings.showLastSeen,
          type: 'toggle',
          action: () => handlePrivacyToggle('showLastSeen'),
        },
        {
          icon: 'account-plus-outline',
          label: '친구 요청 허용',
          value: privacySettings.allowFriendRequests,
          type: 'toggle',
          action: () => handlePrivacyToggle('allowFriendRequests'),
        },
        {
          icon: 'account-cancel-outline',
          label: '차단 목록',
          type: 'navigate',
          route: 'BlockedUsers',
        },
      ],
    },
    {
      title: '알림 설정',
      items: [
        {
          icon: 'heart-outline',
          label: '좋아요 알림',
          value: notificationSettings.likes,
          type: 'toggle',
          action: () => handleNotificationToggle('likes'),
        },
        {
          icon: 'account-check-outline',
          label: '매칭 알림',
          value: notificationSettings.matches,
          type: 'toggle',
          action: () => handleNotificationToggle('matches'),
        },
        {
          icon: 'message-outline',
          label: '메시지 알림',
          value: notificationSettings.messages,
          type: 'toggle',
          action: () => handleNotificationToggle('messages'),
        },
        {
          icon: 'account-multiple-plus-outline',
          label: '친구 요청 알림',
          value: notificationSettings.friendRequests,
          type: 'toggle',
          action: () => handleNotificationToggle('friendRequests'),
        },
      ],
    },
    {
      title: '기타',
      items: [
        {
          icon: 'file-document-outline',
          label: '이용약관',
          type: 'navigate',
          route: 'Terms',
        },
        {
          icon: 'shield-lock-outline',
          label: '개인정보 처리방침',
          type: 'navigate',
          route: 'Privacy',
        },
        {
          icon: 'help-circle-outline',
          label: '고객센터',
          type: 'navigate',
          route: 'Support',
        },
        {
          icon: 'information-outline',
          label: '앱 정보',
          type: 'navigate',
          route: 'AppInfo',
        },
        {
          icon: 'account-remove-outline',
          label: '계정 삭제',
          type: 'action',
          action: () => {
            Alert.alert(
              '계정 삭제',
              '정말로 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
              [
                { text: '취소', style: 'cancel' },
                {
                  text: '삭제',
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
        <Text style={styles.headerTitle}>설정</Text>
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
          <Text style={styles.footerText}>Version 1.0.0</Text>
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