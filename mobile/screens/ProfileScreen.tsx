import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';
import { useProfileData } from '@/hooks/profile/useProfileData';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { EditNicknameModal } from '@/components/modals/EditNicknameModal';
import { LanguageSelector } from '@/components/settings/LanguageSelector';
import { ThemeSelector } from '@/components/settings/ThemeSelector';
import { LetterFromFounder } from '@/components/profile/LetterFromFounder';
import { PremiumSection } from '@/components/profile/PremiumSection';
import { ActivityStats } from '@/components/profile/ActivityStats';
import { LikeSystemStatus } from '@/components/profile/LikeSystemStatus';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

/**
 * 프로필 화면 컴포넌트 - 사용자 정보 및 설정 관리
 * @component
 * @returns {JSX.Element} 프로필 화면 UI
 * @description 사용자 프로필, 통계, 프리미엄 상태, 설정 기능을 제공하는 화면
 */
export const ProfileScreen = () => {
  const [isNicknameModalVisible, setIsNicknameModalVisible] = useState(false);
  
  const navigation = useNavigation();
  const { t } = useAndroidSafeTranslation('profile');
  const { colors } = useTheme();
  
  const {
    isPremiumUser,
    currentPlan,
    joinedGroupsCount,
    sentLikesCount,
    receivedLikesCount,
    matchesCount,
    handleSignOut,
    handleEditNickname,
    handleDeleteAccount,
    isLoggingOut,
  } = useProfileData(t);

  /**
   * 설정 섹션 렌더링
   * @returns {JSX.Element} 설정 메뉴 UI
   */
  const renderSettingsSection = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
        {t('common:navigation.settings')}
      </Text>
      
      <View style={[styles.settingsCard, { backgroundColor: colors.SURFACE, shadowColor: colors.SHADOW }]}>
        <LanguageSelector onLanguageChange={() => {}} />
        <ThemeSelector onThemeChange={() => {}} />
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('MyGroups' as never)}
        >
          <View style={styles.settingContent}>
            <Ionicons name="layers-outline" size={20} color={colors.TEXT.PRIMARY} />
            <Text style={[styles.settingText, { color: colors.TEXT.PRIMARY }]}>
              {t('profile:settings.myGroups')}
            </Text>
          </View>
          <Text style={[styles.settingArrow, { color: colors.TEXT.SECONDARY }]}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('NotificationSettings' as never)}
        >
          <View style={styles.settingContent}>
            <Ionicons name="notifications-outline" size={20} color={colors.TEXT.PRIMARY} />
            <Text style={[styles.settingText, { color: colors.TEXT.PRIMARY }]}>
              {t('profile:settings.notificationSettings')}
            </Text>
          </View>
          <Text style={[styles.settingArrow, { color: colors.TEXT.SECONDARY }]}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('PrivacyPolicy' as never)}
        >
          <View style={styles.settingContent}>
            <Ionicons name="document-text-outline" size={20} color={colors.TEXT.PRIMARY} />
            <Text style={[styles.settingText, { color: colors.TEXT.PRIMARY }]}>
              {t('profile:settings.privacy')}
            </Text>
          </View>
          <Text style={[styles.settingArrow, { color: colors.TEXT.SECONDARY }]}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('TermsOfService' as never)}
        >
          <View style={styles.settingContent}>
            <Ionicons name="book-outline" size={20} color={colors.TEXT.PRIMARY} />
            <Text style={[styles.settingText, { color: colors.TEXT.PRIMARY }]}>
              {t('profile:settings.terms')}
            </Text>
          </View>
          <Text style={[styles.settingArrow, { color: colors.TEXT.SECONDARY }]}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('Support' as never)}
        >
          <View style={styles.settingContent}>
            <Ionicons name="help-circle-outline" size={20} color={colors.TEXT.PRIMARY} />
            <Text style={[styles.settingText, { color: colors.TEXT.PRIMARY }]}>
              {t('profile:settings.support')}
            </Text>
          </View>
          <Text style={[styles.settingArrow, { color: colors.TEXT.SECONDARY }]}>{'>'}</Text>
        </TouchableOpacity>
      </View>
      
      {/* 운영자의 편지 */}
      <LetterFromFounder />
    </View>
  );

  /**
   * 위험 섹션 렌더링
   * @returns {JSX.Element} 로그아웃/계정 삭제 UI
   */
  const renderDangerSection = () => (
    <View style={styles.section}>
      <TouchableOpacity
        style={[
          styles.logoutButton,
          { 
            backgroundColor: isLoggingOut ? colors.BORDER : colors.WARNING,
            opacity: isLoggingOut ? 0.6 : 1 
          }
        ]}
        onPress={handleSignOut}
        disabled={isLoggingOut}
        activeOpacity={0.8}
      >
        <View style={styles.logoutButtonContent}>
          <Ionicons 
            name="log-out-outline" 
            size={20} 
            color={colors.TEXT.WHITE} 
            style={{ marginRight: SPACING.XS }}
          />
          <Text style={[styles.logoutButtonText, { color: colors.TEXT.WHITE }]}>
            {isLoggingOut ? t('profile:settings.loggingOut') : t('profile:settings.logout')}
          </Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDeleteAccount}
      >
        <Text style={[styles.deleteButtonText, { color: colors.ERROR }]}>
          {t('profile:settings.deleteAccount')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.BACKGROUND }]} 
      edges={Platform.OS === 'android' ? ['top'] : ['top', 'bottom']}
    >
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
          <Text style={[styles.headerTitle, { color: colors.PRIMARY }]}>{t('profile:title')}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.TEXT.PRIMARY }]}>
            {t('profile:subtitle')}
          </Text>
        </View>
        
        <PremiumSection 
          isPremiumUser={isPremiumUser}
          currentPlan={currentPlan}
        />
        
        <ActivityStats
          joinedGroupsCount={joinedGroupsCount}
          sentLikesCount={sentLikesCount}
          receivedLikesCount={receivedLikesCount}
          matchesCount={matchesCount}
        />
        
        <LikeSystemStatus 
          isPremiumUser={isPremiumUser}
        />
        
        {renderSettingsSection()}
        {renderDangerSection()}
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.TEXT.LIGHT }]}>
            {t('profile:footer.version')}{'\n'}
            {t('profile:footer.tagline')}
          </Text>
        </View>
      </ScrollView>
      
      <EditNicknameModal
        visible={isNicknameModalVisible}
        onClose={() => setIsNicknameModalVisible(false)}
        onSuccess={() => {
          Alert.alert(t('common:status.success'), t('common:modals.editNickname.changeSuccess'));
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.LG,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    marginBottom: SPACING.XS,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.MD,
  },
  section: {
    marginHorizontal: SPACING.MD,
    marginTop: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    marginBottom: SPACING.MD,
  },
  settingsCard: {
    borderRadius: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.MD,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: FONT_SIZES.MD,
    marginLeft: SPACING.MD,
  },
  settingArrow: {
    fontSize: FONT_SIZES.LG,
  },
  logoutButton: {
    padding: SPACING.MD,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.SM,
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  deleteButton: {
    padding: SPACING.SM,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: FONT_SIZES.SM,
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.XL,
    marginBottom: SPACING.XL,
  },
  footerText: {
    fontSize: FONT_SIZES.SM,
    textAlign: 'center',
    lineHeight: 20,
  },
});