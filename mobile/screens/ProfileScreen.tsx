import React, { useState } from 'react';
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
import { useAuth } from '@clerk/clerk-expo';
import { useAuthStore } from '@/store/slices/authSlice';
import { useLikeStore } from '@/store/slices/likeSlice';
import { useGroupStore } from '@/store/slices/groupSlice';
import { usePremiumStore, premiumSelectors } from '@/store/slices/premiumSlice';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

export const ProfileScreen: React.FC = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const authStore = useAuthStore();
  const likeStore = useLikeStore();
  const groupStore = useGroupStore();
  
  const isPremiumUser = usePremiumStore(premiumSelectors.isPremiumUser());
  const currentPlan = usePremiumStore(premiumSelectors.getCurrentPlan());

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

  const handleEditNickname = () => {
    Alert.alert(
      '닉네임 변경',
      '닉네임 변경 기능은 곧 추가될 예정입니다.',
      [{ text: '확인' }]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '계정 삭제',
      '정말 계정을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '알림',
              '계정 삭제 기능은 곧 추가될 예정입니다.',
              [{ text: '확인' }]
            );
          },
        },
      ]
    );
  };

  const handleRewindLike = async () => {
    const lastLike = likeStore.getLastLike();
    if (!lastLike) {
      Alert.alert('알림', '되돌릴 좋아요가 없습니다.');
      return;
    }

    const timeLeft = Math.ceil((lastLike.createdAt.getTime() + 5 * 60 * 1000 - Date.now()) / 1000 / 60);
    
    Alert.alert(
      '좋아요 되돌리기',
      `마지막으로 보낸 좋아요를 되돌리시겠습니까?\n\n• 대상: 익명 사용자\n• ${lastLike.isSuper ? '슈퍼 좋아요' : '일반 좋아요'}\n• 남은 시간: ${Math.max(0, timeLeft)}분\n\n⚠️ 되돌린 후에는 다시 되돌릴 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '되돌리기',
          style: 'destructive',
          onPress: async () => {
            const success = await likeStore.rewindLastLike();
            if (success) {
              Alert.alert(
                '완료',
                '좋아요가 성공적으로 되돌려졌습니다.\n해당 사용자에게 보낸 좋아요가 취소되었습니다.',
                [{ text: '확인' }]
              );
            } else {
              Alert.alert(
                '오류',
                likeStore.error || '좋아요 되돌리기에 실패했습니다.',
                [{ text: '확인' }]
              );
            }
          },
        },
      ]
    );
  };

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
          <Text style={styles.editButtonText}>편집</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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

  const renderStatsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>활동 통계</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{groupStore.joinedGroups.length}</Text>
          <Text style={styles.statLabel}>참여 그룹</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{likeStore.sentLikes.length}</Text>
          <Text style={styles.statLabel}>보낸 좋아요</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{likeStore.getReceivedLikesCount()}</Text>
          <Text style={styles.statLabel}>받은 좋아요</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{likeStore.matches.length}</Text>
          <Text style={styles.statLabel}>총 매칭</Text>
        </View>
      </View>
    </View>
  );

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

  const renderSettingsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>설정</Text>
      
      <View style={styles.settingsCard}>
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('WhoLikesYou' as never)}
        >
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingText}>좋아요 받은 사람 보기</Text>
            {!isPremiumUser && (
              <Text style={styles.premiumBadge}>PRO</Text>
            )}
          </View>
          <Text style={styles.settingArrow}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('MyGroups' as never)}
        >
          <Text style={styles.settingText}>내 그룹 관리</Text>
          <Text style={styles.settingArrow}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('NotificationSettings' as never)}
        >
          <Text style={styles.settingText}>알림 설정</Text>
          <Text style={styles.settingArrow}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>개인정보 처리방침</Text>
          <Text style={styles.settingArrow}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>서비스 이용약관</Text>
          <Text style={styles.settingArrow}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>고객지원</Text>
          <Text style={styles.settingArrow}>{'>'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  editButtonText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '500',
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