import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
// import { useAuth } from '@clerk/clerk-expo';
import { useAuth } from '@/hooks/useDevAuth';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '@/store/slices/authSlice';
import { useLikeStore } from '@/store/slices/likeSlice';
import { useGroupStore } from '@/store/slices/groupSlice';
import { usePremiumStore, premiumSelectors } from '@/store/slices/premiumSlice';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { EditNicknameModal } from '@/components/modals/EditNicknameModal';
import { LanguageSelector } from '@/components/settings/LanguageSelector';
import { AppMode, MODE_TEXTS } from '@shared/types';
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
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const authStore = useAuthStore();
  const likeStore = useLikeStore();
  const groupStore = useGroupStore();
  
  const isPremiumUser = usePremiumStore(premiumSelectors.isPremiumUser());
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
  const handleSignOut = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await signOut();
              authStore.clearAuth();
              // 다른 스토어들도 초기화할 수 있음
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  /**
   * 닉네임 편집 핸들러
   * @description 닉네임 편집 모달을 표시
   */
  const handleEditNickname = () => {
    setIsNicknameModalVisible(true);
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
      Alert.alert('알림', '되돌릴 좋아요가 없습니다.');
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
      <Text style={styles.sectionTitle}>프로필 정보</Text>
      
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {authStore.user?.nickname?.charAt(0) || '?'}
            </Text>
          </View>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.nickname}>
            {authStore.user?.nickname || '닉네임 없음'}
          </Text>
          <Text style={styles.userId}>
            ID: {authStore.user?.anonymousId || 'Unknown'}
          </Text>
          <Text style={styles.joinDate}>
            가입일: {authStore.user?.createdAt?.toLocaleDateString('ko-KR') || 'Unknown'}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditNickname}
        >
          <Ionicons name="pencil" size={16} color={COLORS.TEXT.PRIMARY} />
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
          isPremiumUser ? styles.premiumCardActive : styles.premiumCardInactive,
        ]}
        onPress={() => navigation.navigate('Premium' as never)}
      >
        <View style={styles.premiumHeader}>
          <Text style={[
            styles.premiumTitle,
            isPremiumUser ? styles.premiumTitleActive : styles.premiumTitleInactive,
          ]}>
            {isPremiumUser ? '✨ Premium 활성' : '⭐ Premium으로 업그레이드'}
          </Text>
          {isPremiumUser && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>
                {currentPlan.includes('yearly') ? '연간' : '월간'}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={styles.premiumDescription}>
          {isPremiumUser 
            ? '모든 프리미엄 기능을 이용하고 있습니다'
            : '무제한 좋아요, 매칭 우선권 등 프리미엄 기능을 만나보세요'
          }
        </Text>
        
        <View style={styles.premiumFeatures}>
          <Text style={styles.premiumFeature}>
            💕 {isPremiumUser ? '무제한 좋아요' : '일일 좋아요 1개 → 무제한'}
          </Text>
          <Text style={styles.premiumFeature}>
            👀 {isPremiumUser ? '좋아요 받은 사람 확인 가능' : '누가 좋아요를 보냈는지 확인'}
          </Text>
          <Text style={styles.premiumFeature}>
            ⚡ {isPremiumUser ? '우선 매칭 활성' : '우선 매칭으로 더 빠른 연결'}
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
      <Text style={styles.sectionTitle}>{t('profile:stats.title', '활동 통계')}</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{groupStore.joinedGroups.length}</Text>
          <Text style={styles.statLabel}>{t('profile:stats.joinedGroups', '참여 그룹')}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{likeStore.sentLikes.length}</Text>
          <Text style={styles.statLabel}>{t('profile:stats.sentLikes', '보낸 좋아요')}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{likeStore.getReceivedLikesCount()}</Text>
          <Text style={styles.statLabel}>{t('profile:stats.receivedLikes', '받은 좋아요')}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{likeStore.matches.length}</Text>
          <Text style={styles.statLabel}>{t('profile:stats.totalMatches', '총 매칭')}</Text>
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
      <Text style={styles.sectionTitle}>좋아요 시스템</Text>
      
      <View style={styles.likeSystemCard}>
        <View style={styles.likeSystemItem}>
          <Text style={styles.likeSystemLabel}>일일 무료 좋아요</Text>
          <Text style={styles.likeSystemValue}>
            {likeStore.getRemainingFreeLikes()} / 1
          </Text>
        </View>
        
        <View style={styles.likeSystemItem}>
          <Text style={styles.likeSystemLabel}>프리미엄 좋아요</Text>
          <Text style={styles.likeSystemValue}>
            {likeStore.premiumLikesRemaining}개
          </Text>
        </View>
        
        <View style={styles.likeSystemItem}>
          <Text style={styles.likeSystemLabel}>프리미엄 상태</Text>
          <Text style={[
            styles.likeSystemValue,
            likeStore.hasPremium ? styles.premiumActive : styles.premiumInactive
          ]}>
            {likeStore.hasPremium ? '활성' : '비활성'}
          </Text>
        </View>
        
        {isPremiumUser && (
          <>
            <View style={styles.likeSystemItem}>
              <Text style={styles.likeSystemLabel}>⭐ 슈퍼 좋아요</Text>
              <Text style={[styles.likeSystemValue, styles.superLikeValue]}>
                {likeStore.getRemainingSuperLikes()} / {likeStore.dailySuperLikesLimit}
              </Text>
            </View>
            
            <View style={styles.likeSystemItem}>
              <Text style={styles.likeSystemLabel}>↩️ 좋아요 되돌리기</Text>
              <Text style={[
                styles.likeSystemValue,
                likeStore.canRewindLike() ? styles.rewindAvailable : styles.rewindUnavailable
              ]}>
                {likeStore.canRewindLike() ? '사용 가능' : '사용 불가'}
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
          <Text style={styles.upgradeButtonText}>프리미엄 업그레이드</Text>
        </TouchableOpacity>
      )}
      
      {isPremiumUser && likeStore.canRewindLike() && (
        <TouchableOpacity 
          style={styles.rewindButton}
          onPress={handleRewindLike}
        >
          <Text style={styles.rewindButtonText}>↩️ 마지막 좋아요 되돌리기</Text>
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
      
      <View style={styles.settingsCard}>
        <LanguageSelector onLanguageChange={() => {}} />
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('LikeHistory' as never)}
        >
          <View style={styles.settingContent}>
            <Ionicons 
              name={currentMode === AppMode.DATING ? "heart-outline" : "people-outline"} 
              size={20} 
              color={COLORS.TEXT.PRIMARY} 
            />
            <Text style={styles.settingText}>
              {currentMode === AppMode.DATING ? '호감 관리' : '친구 요청 관리'}
            </Text>
          </View>
          <Text style={styles.settingArrow}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('WhoLikesYou' as never)}
        >
          <View style={styles.settingContent}>
            <Ionicons name="eye-outline" size={20} color={COLORS.TEXT.PRIMARY} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>
                {currentMode === AppMode.DATING ? '받은 호감 보기' : '받은 친구 요청 보기'}
              </Text>
              {!isPremiumUser && (
                <Text style={styles.premiumBadge}>PRO</Text>
              )}
            </View>
          </View>
          <Text style={styles.settingArrow}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('MyGroups' as never)}
        >
          <View style={styles.settingContent}>
            <Ionicons name="layers-outline" size={20} color={COLORS.TEXT.PRIMARY} />
            <Text style={styles.settingText}>내 그룹 관리</Text>
          </View>
          <Text style={styles.settingArrow}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('NotificationSettings' as never)}
        >
          <View style={styles.settingContent}>
            <Ionicons name="notifications-outline" size={20} color={COLORS.TEXT.PRIMARY} />
            <Text style={styles.settingText}>알림 설정</Text>
          </View>
          <Text style={styles.settingArrow}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="document-text-outline" size={20} color={COLORS.TEXT.PRIMARY} />
            <Text style={styles.settingText}>개인정보 처리방침</Text>
          </View>
          <Text style={styles.settingArrow}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="book-outline" size={20} color={COLORS.TEXT.PRIMARY} />
            <Text style={styles.settingText}>서비스 이용약관</Text>
          </View>
          <Text style={styles.settingArrow}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="help-circle-outline" size={20} color={COLORS.TEXT.PRIMARY} />
            <Text style={styles.settingText}>고객지원</Text>
          </View>
          <Text style={styles.settingArrow}>{'>'}</Text>
        </TouchableOpacity>
      </View>
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
        style={styles.logoutButton}
        onPress={handleSignOut}
        disabled={isLoggingOut}
      >
        <Text style={styles.logoutButtonText}>
          {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDeleteAccount}
      >
        <Text style={styles.deleteButtonText}>계정 삭제</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>프로필</Text>
          <Text style={styles.headerSubtitle}>
            계정 정보와 활동 통계를 확인하세요
          </Text>
        </View>
        
        {renderProfileSection()}
        {renderPremiumSection()}
        {renderStatsSection()}
        {renderLikeSystemSection()}
        {renderSettingsSection()}
        {renderDangerSection()}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Glimpse v0.1.0{'\n'}
            익명 데이팅의 새로운 시작
          </Text>
        </View>
      </ScrollView>
      
      <EditNicknameModal
        visible={isNicknameModalVisible}
        onClose={() => setIsNicknameModalVisible(false)}
        onSuccess={() => {
          Alert.alert('성공', '닉네임이 변경되었습니다.');
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
    margin: SPACING.MD,
    marginBottom: SPACING.LG,
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
    borderRadius: 8,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
    marginBottom: SPACING.MD,
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
  },
  premiumCardActive: {
    backgroundColor: COLORS.SUCCESS + '20',
    borderWidth: 2,
    borderColor: COLORS.SUCCESS,
  },
  premiumCardInactive: {
    backgroundColor: COLORS.PRIMARY + '10',
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
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
  premiumTitleActive: {
    color: COLORS.SUCCESS,
  },
  premiumTitleInactive: {
    color: COLORS.PRIMARY,
  },
  premiumBadge: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.XS,
    paddingVertical: 2,
    borderRadius: 8,
  },
  premiumBadgeText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.XS,
    fontWeight: '600',
  },
  premiumDescription: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.MD,
    lineHeight: 20,
  },
  premiumFeatures: {
    backgroundColor: COLORS.SURFACE + '80',
    borderRadius: 8,
    padding: SPACING.MD,
  },
  premiumFeature: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.XS,
    lineHeight: 18,
  },
});