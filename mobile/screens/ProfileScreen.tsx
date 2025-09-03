import React, { useState, useEffect } from 'react';
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
import { useAuth } from '@/hooks/useAuth'; // 통합 인증 훅 - 환경에 따라 Clerk/DevAuth 자동 선택
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '@/store/slices/authSlice';
import { useLikeStore } from '@/store/slices/likeSlice';
import { useGroupStore } from '@/store/slices/groupSlice';
import { usePremiumStore, premiumSelectors } from '@/store/slices/premiumSlice';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { EditNicknameModal } from '@/components/modals/EditNicknameModal';
import { LanguageSelector } from '@/components/settings/LanguageSelector';
import { ThemeSelector } from '@/components/settings/ThemeSelector';
import { LetterFromFounder } from '@/components/profile/LetterFromFounder';
import { useTheme } from '@/hooks/useTheme';
import { AppMode, MODE_TEXTS } from '../shared/types';
import apiClient from '@/services/api/config';

/**
 * 프로필 화면 컴포넌트 - 사용자 정보 및 설정 관리
 * @component
 * @returns {JSX.Element} 프로필 화면 UI
 * @description 사용자 프로필, 통계, 프리미엄 상태, 설정 기능을 제공하는 화면
 */
export const ProfileScreen = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isNicknameModalVisible, setIsNicknameModalVisible] = useState(false);
  
  const navigation = useNavigation();
  const { t } = useAndroidSafeTranslation('profile');
  const { signOut } = useAuth();
  const { colors } = useTheme();
  const authStore = useAuthStore();
  const likeStore = useLikeStore();
  const groupStore = useGroupStore();
  
  // 개발 환경에서는 authStore.user?.isPremium을 직접 사용
  const isPremiumUser = __DEV__ ? authStore.user?.isPremium || false : usePremiumStore(premiumSelectors.isPremiumUser());
  const currentPlan = usePremiumStore(premiumSelectors.getCurrentPlan());
  const currentMode = authStore.currentMode || AppMode.DATING;
  const modeTexts = MODE_TEXTS[currentMode];
  
  // 화면이 포커스될 때마다 최신 프로필 가져오기
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        const response = await apiClient.get<{ success: boolean; data: any }>('/users/profile');
        if (response.success && response.data) {
          // 사용자 정보 업데이트
          const currentUser = authStore.user;
          if (currentUser) {
            authStore.updateUserProfile({
              ...currentUser,
              nickname: response.data.nickname,
              bio: response.data.bio,
              profileImage: response.data.profileImage,
              isPremium: response.data.isPremium,
              credits: response.data.credits,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch latest profile:', error);
      }
    });

    return unsubscribe;
  }, [navigation, authStore]);

  /**
   * 로그아웃 핸들러
   * @description Clerk 로그아웃 및 로컬 상태 초기화를 처리
   */
  const handleSignOut = async () => {
    // 웹 환경과 네이티브 환경 구분 처리
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(t('profile:settings.logoutConfirm'));
      if (!confirmed) return;
      
      setIsLoggingOut(true);
      try {
        // 스토어 초기화를 먼저 수행
        authStore.clearAuth();
        likeStore.clearLikes();
        groupStore.clearGroups();
        
        // Clerk/DevAuth 로그아웃 수행
        await signOut();
        
        // 로그아웃 후 자동으로 Auth 화면으로 이동합니다.
        // AppNavigator의 조건부 렌더링이 처리합니다.
      } catch (error) {
        console.error('Sign out error:', error);
        window.alert(t('profile:settings.logoutError'));
      } finally {
        setIsLoggingOut(false);
      }
    } else {
      Alert.alert(
        t('profile:settings.logout'),
        t('profile:settings.logoutConfirm'),
        [
          { text: t('common:buttons.cancel'), style: 'cancel' },
          {
            text: t('profile:settings.logout'),
            style: 'destructive',
            onPress: async () => {
              setIsLoggingOut(true);
              try {
                // 스토어 초기화를 먼저 수행
                authStore.clearAuth();
                likeStore.clearLikes();
                groupStore.clearGroups();
                
                // Clerk/DevAuth 로그아웃 수행
                await signOut();
                
                // 로그아웃 후 자동으로 Auth 화면으로 이동합니다.
                // AppNavigator의 조건부 렌더링이 처리합니다.
              } catch (error) {
                console.error('Sign out error:', error);
                Alert.alert(t('common:status.error'), t('profile:settings.logoutError'));
              } finally {
                setIsLoggingOut(false);
              }
            },
          },
        ]
      );
    }
  };

  /**
   * 닉네임 편집 핸들러
   * @description 닉네임 편집 모달을 표시
   */
  const handleEditNickname = () => {
    navigation.navigate('ProfileEdit' as never);
  };

  /**
   * 계정 삭제 핸들러
   * @description 계정 삭제 화면으로 이동
   */
  const handleDeleteAccount = () => {
    navigation.navigate('DeleteAccount' as never);
  };

  /**
   * 좋아요 되돌리기 핸들러
   * @returns {Promise<void>}
   * @description 프리미엄 기능으로 마지막 좋아요를 취소하는 함수
   */
  const handleRewindLike = async () => {
    const lastLike = likeStore.getLastLike();
    if (!lastLike) {
      Alert.alert(t('common:status.info'), t('profile:likeSystem.noRewinds'));
      return;
    }

    const timeLeft = Math.ceil((lastLike.createdAt.getTime() + 5 * 60 * 1000 - Date.now()) / 1000 / 60);
    
    Alert.alert(
      t('profile:likeSystem.rewindTitle'),
      t('profile:likeSystem.rewindMessage', { 
        type: lastLike.isSuper ? t('profile:likeSystem.superLike') : t('profile:likeSystem.normalLike'),
        timeLeft: Math.max(0, timeLeft)
      }),
      [
        { text: t('common:buttons.cancel'), style: 'cancel' },
        {
          text: t('profile:likeSystem.rewindButton'),
          style: 'destructive',
          onPress: async () => {
            const success = await likeStore.rewindLastLike();
            if (success) {
              Alert.alert(
                t('profile:likeSystem.rewindSuccess'),
                t('profile:likeSystem.rewindSuccessMessage'),
                [{ text: t('common:buttons.confirm') }]
              );
            } else {
              Alert.alert(
                t('common:status.error'),
                likeStore.error || t('profile:likeSystem.rewindError'),
                [{ text: t('common:buttons.confirm') }]
              );
            }
          },
        },
      ]
    );
  };

  /**
   * 프로필 섹션 렌더링
   * @returns {JSX.Element} 프로필 정보 UI
   * @description 사용자 닉네임, ID, 가입일 등을 표시
   */
  const renderProfileSection = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>{t('profile:info.basicInfo')}</Text>
      
      <View style={[styles.profileCard, { backgroundColor: colors.SURFACE, shadowColor: colors.SHADOW }]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: colors.PRIMARY }]}>
            <Text style={[styles.avatarText, { color: colors.TEXT.WHITE }]}>
              {authStore.user?.nickname?.charAt(0) || '?'}
            </Text>
          </View>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={[styles.nickname, { color: colors.TEXT.PRIMARY }]}>
            {authStore.user?.nickname || t('common:user.noNickname')}
          </Text>
          <Text style={[styles.userId, { color: colors.TEXT.SECONDARY }]}>
            ID: {authStore.user?.anonymousId || t('common:user.anonymous')}
          </Text>
          <Text style={[styles.joinDate, { color: colors.TEXT.SECONDARY }]}>
            {t('profile:info.joinDate')}: {authStore.user?.createdAt?.toLocaleDateString() || t('common:user.notRegistered')}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: colors.BACKGROUND, borderColor: colors.BORDER }]}
          onPress={handleEditNickname}
        >
          <Ionicons name="create-outline" size={20} color={colors.TEXT.PRIMARY} />
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * 프리미엄 섹션 렌더링
   * @returns {JSX.Element} 프리미엄 상태 UI
   * @description 프리미엄 구독 상태와 혜택을 표시
   */
  const renderPremiumSection = () => (
    <View style={styles.section}>
      <TouchableOpacity
        style={[
          styles.premiumCard,
          { backgroundColor: colors.SURFACE, borderColor: colors.BORDER },
          isPremiumUser 
            ? { borderColor: colors.SUCCESS, backgroundColor: colors.SUCCESS + '10' } 
            : { borderColor: colors.PRIMARY + '40', backgroundColor: colors.PRIMARY + '10' },
        ]}
        onPress={() => navigation.navigate('Premium' as never)}
      >
        <View style={styles.premiumHeader}>
          <Text style={[
            styles.premiumTitle,
            { color: isPremiumUser ? colors.SUCCESS : colors.PRIMARY },
          ]}>
            {isPremiumUser ? t('profile:premium.active') : t('profile:premium.upgrade')}
          </Text>
          {isPremiumUser && (
            <View style={[styles.premiumBadge, { backgroundColor: colors.SUCCESS }]}>
              <Text style={[styles.premiumBadgeText, { color: colors.TEXT.WHITE }]}>
                {currentPlan.includes('yearly') ? t('profile:premium.yearly') : t('profile:premium.monthly')}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={[styles.premiumDescription, { color: colors.TEXT.SECONDARY }]}>
          {isPremiumUser 
            ? t('profile:premium.activeDescription')
            : t('profile:premium.inactiveDescription')
          }
        </Text>
        
        <View style={styles.premiumFeatures}>
          <Text style={[styles.premiumFeature, { color: colors.TEXT.PRIMARY }]}>
            💕 {isPremiumUser ? t('profile:premium.features.unlimitedLikes') : t('profile:premium.features.dailyToUnlimited')}
          </Text>
          <Text style={[styles.premiumFeature, { color: colors.TEXT.PRIMARY }]}>
            👀 {isPremiumUser ? t('profile:premium.features.seeWhoLikedYou') : t('profile:premium.features.seeWhoLikedYouInfo')}
          </Text>
          <Text style={[styles.premiumFeature, { color: colors.TEXT.PRIMARY }]}>
            ⚡ {isPremiumUser ? t('profile:premium.features.priorityMatching') : t('profile:premium.features.priorityMatchingInfo')}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  /**
   * 통계 섹션 렌더링
   * @returns {JSX.Element} 활동 통계 UI
   * @description 참여 그룹, 좋아요, 매칭 통계를 표시
   */
  const renderStatsSection = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>{t('profile:stats.title', '활동 통계')}</Text>
      
      <View style={styles.statsGrid}>
        <View style={[styles.statItem, { backgroundColor: colors.SURFACE, shadowColor: colors.SHADOW }]}>
          <Text style={[styles.statNumber, { color: colors.PRIMARY }]}>{groupStore.joinedGroups.length}</Text>
          <Text style={[styles.statLabel, { color: colors.TEXT.SECONDARY }]}>{t('profile:stats.joinedGroups', '참여 그룹')}</Text>
        </View>
        
        <View style={[styles.statItem, { backgroundColor: colors.SURFACE, shadowColor: colors.SHADOW }]}>
          <Text style={[styles.statNumber, { color: colors.PRIMARY }]}>{likeStore.sentLikes.length}</Text>
          <Text style={[styles.statLabel, { color: colors.TEXT.SECONDARY }]}>{t('profile:stats.sentLikes', '보낸 좋아요')}</Text>
        </View>
        
        <View style={[styles.statItem, { backgroundColor: colors.SURFACE, shadowColor: colors.SHADOW }]}>
          <Text style={[styles.statNumber, { color: colors.PRIMARY }]}>{likeStore.getReceivedLikesCount()}</Text>
          <Text style={[styles.statLabel, { color: colors.TEXT.SECONDARY }]}>{t('profile:stats.receivedLikes', '받은 좋아요')}</Text>
        </View>
        
        <View style={[styles.statItem, { backgroundColor: colors.SURFACE, shadowColor: colors.SHADOW }]}>
          <Text style={[styles.statNumber, { color: colors.PRIMARY }]}>{likeStore.matches.length}</Text>
          <Text style={[styles.statLabel, { color: colors.TEXT.SECONDARY }]}>{t('profile:stats.totalMatches', '총 매칭')}</Text>
        </View>
      </View>
    </View>
  );

  /**
   * 좋아요 시스템 섹션 렌더링
   * @returns {JSX.Element} 좋아요 시스템 UI
   * @description 일일 좋아요, 프리미엄 좋아요 현황을 표시
   */
  const renderLikeSystemSection = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>{t('profile:likeSystem.title')}</Text>
      
      <View style={[styles.likeSystemCard, { backgroundColor: colors.SURFACE, shadowColor: colors.SHADOW }]}>
        <View style={[styles.likeSystemItem, { borderBottomColor: colors.BORDER }]}>
          <Text style={[styles.likeSystemLabel, { color: colors.TEXT.PRIMARY }]}>{t('profile:likeSystem.dailyFreeLikes')}</Text>
          <Text style={[styles.likeSystemValue, { color: colors.TEXT.PRIMARY }]}>
            {likeStore.getRemainingFreeLikes()} / 1
          </Text>
        </View>
        
        <View style={[styles.likeSystemItem, { borderBottomColor: colors.BORDER }]}>
          <Text style={[styles.likeSystemLabel, { color: colors.TEXT.PRIMARY }]}>{t('profile:likeSystem.premiumLikes')}</Text>
          <Text style={[styles.likeSystemValue, { color: colors.TEXT.PRIMARY }]}>
            {t('profile:likeSystem.premiumLikesCount', { count: likeStore.premiumLikesRemaining })}
          </Text>
        </View>
        
        <View style={[styles.likeSystemItem, { borderBottomColor: colors.BORDER }]}>
          <Text style={[styles.likeSystemLabel, { color: colors.TEXT.PRIMARY }]}>{t('profile:likeSystem.premiumStatus')}</Text>
          <Text style={[
            styles.likeSystemValue,
            { color: colors.TEXT.PRIMARY },
            isPremiumUser ? { color: colors.SUCCESS } : { color: colors.TEXT.SECONDARY }
          ]}>
            {isPremiumUser ? t('profile:likeSystem.active') : t('profile:likeSystem.inactive')}
          </Text>
        </View>
        
        {isPremiumUser && (
          <>
            <View style={[styles.likeSystemItem, { borderBottomColor: colors.BORDER }]}>
              <Text style={[styles.likeSystemLabel, { color: colors.TEXT.PRIMARY }]}>{t('profile:likeSystem.superLikes')}</Text>
              <Text style={[styles.likeSystemValue, { color: colors.WARNING, fontWeight: '600' }]}>
                {likeStore.getRemainingSuperLikes()} / {likeStore.dailySuperLikesLimit}
              </Text>
            </View>
            
            <View style={[styles.likeSystemItem, { borderBottomColor: colors.BORDER }]}>
              <Text style={[styles.likeSystemLabel, { color: colors.TEXT.PRIMARY }]}>{t('profile:likeSystem.rewind')}</Text>
              <Text style={[
                styles.likeSystemValue,
                likeStore.canRewindLike() 
                  ? { color: colors.SUCCESS, fontWeight: '600' }
                  : { color: colors.TEXT.LIGHT, fontWeight: '500' }
              ]}>
                {likeStore.canRewindLike() ? t('profile:likeSystem.available') : t('profile:likeSystem.unavailable')}
              </Text>
            </View>
          </>
        )}
      </View>
      
      {!isPremiumUser && (
        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={() => navigation.navigate('Premium' as never)}
        >
          <Text style={styles.upgradeButtonText}>{t('profile:premium.upgrade')}</Text>
        </TouchableOpacity>
      )}
      
      {isPremiumUser && likeStore.canRewindLike() && (
        <TouchableOpacity 
          style={styles.rewindButton}
          onPress={handleRewindLike}
        >
          <Text style={styles.rewindButtonText}>{t('profile:likeSystem.rewind')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  /**
   * 설정 섹션 렌더링
   * @returns {JSX.Element} 설정 메뉴 UI
   * @description 각종 설정 및 관리 메뉴를 표시
   */
  const renderSettingsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('common:navigation.settings')}</Text>
      
      <View style={[styles.settingsCard, { backgroundColor: colors.SURFACE, shadowColor: colors.SHADOW }]}>
        <LanguageSelector onLanguageChange={() => {}} />
        <ThemeSelector onThemeChange={() => {}} />
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('MyGroups' as never)}
        >
          <View style={styles.settingContent}>
            <Ionicons name="layers-outline" size={20} color={colors.TEXT.PRIMARY} />
            <Text style={[styles.settingText, { color: colors.TEXT.PRIMARY }]}>{t('profile:settings.myGroups')}</Text>
          </View>
          <Text style={[styles.settingArrow, { color: colors.TEXT.SECONDARY }]}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('NotificationSettings' as never)}
        >
          <View style={styles.settingContent}>
            <Ionicons name="notifications-outline" size={20} color={colors.TEXT.PRIMARY} />
            <Text style={[styles.settingText, { color: colors.TEXT.PRIMARY }]}>{t('profile:settings.notificationSettings')}</Text>
          </View>
          <Text style={[styles.settingArrow, { color: colors.TEXT.SECONDARY }]}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('PrivacyPolicy' as never)}
        >
          <View style={styles.settingContent}>
            <Ionicons name="document-text-outline" size={20} color={colors.TEXT.PRIMARY} />
            <Text style={[styles.settingText, { color: colors.TEXT.PRIMARY }]}>{t('profile:settings.privacy')}</Text>
          </View>
          <Text style={[styles.settingArrow, { color: colors.TEXT.SECONDARY }]}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('TermsOfService' as never)}
        >
          <View style={styles.settingContent}>
            <Ionicons name="book-outline" size={20} color={colors.TEXT.PRIMARY} />
            <Text style={[styles.settingText, { color: colors.TEXT.PRIMARY }]}>{t('profile:settings.terms')}</Text>
          </View>
          <Text style={[styles.settingArrow, { color: colors.TEXT.SECONDARY }]}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('Support' as never)}
        >
          <View style={styles.settingContent}>
            <Ionicons name="help-circle-outline" size={20} color={colors.TEXT.PRIMARY} />
            <Text style={[styles.settingText, { color: colors.TEXT.PRIMARY }]}>{t('profile:settings.support')}</Text>
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
   * @description 로그아웃 및 계정 삭제 버튼을 표시
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
        <Text style={styles.deleteButtonText}>{t('profile:settings.deleteAccount')}</Text>
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
        
        {/* 기본정보 섹션 제거 - renderProfileSection() 호출 제거 */}
        {renderPremiumSection()}
        {renderStatsSection()}
        {renderLikeSystemSection()}
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
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.SURFACE,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerTitle: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.PRIMARY,
  },
  section: {
    marginHorizontal: SPACING.MD,
    marginTop: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.MD,
  },
  profileCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: SPACING.LG,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: SPACING.MD,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 4,
  },
  userId: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 2,
  },
  joinDate: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
  },
  editButton: {
    backgroundColor: COLORS.BACKGROUND,
    padding: SPACING.SM,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: SPACING.MD,
    alignItems: 'center',
    width: '48%',
    marginBottom: SPACING.SM,
    elevation: 1,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS,
  },
  statLabel: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
  likeSystemCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  likeSystemItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  likeSystemLabel: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.PRIMARY,
  },
  likeSystemValue: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  premiumActive: {
    color: COLORS.SUCCESS,
  },
  premiumInactive: {
    color: COLORS.TEXT.SECONDARY,
  },
  superLikeValue: {
    color: COLORS.WARNING,
    fontWeight: '600',
  },
  rewindAvailable: {
    color: COLORS.SUCCESS,
    fontWeight: '600',
  },
  rewindUnavailable: {
    color: COLORS.TEXT.LIGHT,
    fontWeight: '500',
  },
  rewindButton: {
    backgroundColor: COLORS.WARNING,
    borderRadius: 8,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
  },
  rewindButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  upgradeButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.SM,
  },
  settingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.PRIMARY,
    marginRight: SPACING.SM,
  },
  settingArrow: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
  },
  logoutButton: {
    backgroundColor: COLORS.WARNING,
    borderRadius: 12,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
    marginBottom: SPACING.MD,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: COLORS.TRANSPARENT,
    borderWidth: 1,
    borderColor: COLORS.ERROR,
    borderRadius: 8,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: COLORS.ERROR,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.XL,
  },
  footerText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.LIGHT,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Premium section styles
  premiumCard: {
    borderRadius: 16,
    padding: SPACING.LG,
    marginBottom: SPACING.MD,
    borderWidth: 2,
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  premiumTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    flex: 1,
  },
  premiumBadge: {
    paddingHorizontal: SPACING.XS,
    paddingVertical: 2,
    borderRadius: 8,
  },
  premiumBadgeText: {
    fontSize: FONT_SIZES.XS,
    fontWeight: '600',
  },
  premiumDescription: {
    fontSize: FONT_SIZES.MD,
    marginBottom: SPACING.MD,
    lineHeight: 20,
  },
  premiumFeatures: {
    borderRadius: 8,
    padding: SPACING.MD,
  },
  premiumFeature: {
    fontSize: FONT_SIZES.SM,
    marginBottom: SPACING.XS,
    lineHeight: 18,
  },
});