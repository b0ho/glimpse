import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/slices/authSlice';
import { useProfileStore } from '@/store/slices/profileSlice';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileInfoCards } from '@/components/profile/ProfileInfoCards';
import { LikesReceivedModal } from '@/components/profile/LikesReceivedModal';
import { FriendRequestsModal } from '@/components/profile/FriendRequestsModal';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { Like } from '@shared/types';

type ProfileScreenNavigationProp = any;

const ProfileScreenV2: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, clearAuth } = useAuthStore();
  const { 
    userProfile, 
    likesReceived, 
    friendRequests, 
    fetchUserProfile,
    fetchLikesReceived, 
    fetchFriendRequests,
    loading 
  } = useProfileStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile(user.id);
    }
  }, [user?.id]);

  const stats = {
    totalLikes: likesReceived?.length || 0,
    mutualMatches: userProfile?.matches?.filter(m => m.isMutual)?.length || 0,
    friendCount: userProfile?.friends?.length || 0,
    groupCount: userProfile?.groupMemberships?.length || 0,
  };

  const badges = [
    userProfile?.isPremium && { id: 'premium', icon: 'crown', color: '#FFD700', label: '프리미엄' },
    userProfile?.isVerified && { id: 'verified', icon: 'check-decagram', color: '#1DA1F2', label: '인증됨' },
    stats.mutualMatches >= 10 && { id: 'popular', icon: 'fire', color: '#FF6B6B', label: '인기' },
    stats.groupCount >= 5 && { id: 'social', icon: 'account-group', color: '#4ECDC4', label: '소셜' },
  ].filter(Boolean) as any[];

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        user?.id && fetchUserProfile(user.id),
        fetchLikesReceived(),
        fetchFriendRequests(),
      ]);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLikesPress = () => {
    if (userProfile?.isPremium) {
      setShowLikesModal(true);
    } else {
      navigation.navigate('Premium');
    }
  };

  const handleLikePress = (like: Like) => {
    // 좋아요를 보낸 사람의 프로필로 이동하거나 채팅 시작
    Alert.alert(
      '프로필 보기',
      `${like.fromUser?.nickname || '익명'}님의 프로필을 보시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '프로필 보기', 
          onPress: () => {
            // Navigate to user profile
            navigation.navigate('UserProfile', { userId: like.fromUserId });
          }
        },
        {
          text: '좋아요 보내기',
          onPress: () => {
            // Send like back
            navigation.navigate('Groups', { 
              groupId: like.groupId,
              sendLikeTo: like.fromUserId 
            });
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: () => clearAuth(),
        },
      ]
    );
  };

  const renderRecentActivity = () => (
    <View style={styles.activitySection}>
      <Text style={styles.sectionTitle}>최근 활동</Text>
      <View style={styles.activityList}>
        {likesReceived.length > 0 && (
          <View style={styles.activityItem}>
            <MaterialCommunityIcons name="heart" size={20} color="#FF4757" />
            <Text style={styles.activityText}>새로운 좋아요를 받았습니다</Text>
            <Text style={styles.activityTime}>방금 전</Text>
          </View>
        )}
        
        {friendRequests.length > 0 && (
          <View style={styles.activityItem}>
            <MaterialCommunityIcons name="account-plus" size={20} color="#4ECDC4" />
            <Text style={styles.activityText}>{friendRequests.length}개의 친구 요청</Text>
            <Text style={styles.activityTime}>확인 필요</Text>
          </View>
        )}
        
        <View style={styles.activityItem}>
          <MaterialCommunityIcons name="account-group" size={20} color="#4A90E2" />
          <Text style={styles.activityText}>그룹 활동 중</Text>
          <Text style={styles.activityTime}>활성</Text>
        </View>
      </View>
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtonsContainer}>
      <TouchableOpacity 
        style={[styles.actionButton, styles.settingsButton]}
        onPress={() => navigation.navigate('Settings')}
      >
        <MaterialCommunityIcons name="cog" size={20} color="#666" />
        <Text style={styles.actionButtonText}>설정</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.actionButton, styles.premiumButton]}
        onPress={() => navigation.navigate('Premium')}
      >
        <MaterialCommunityIcons name="crown" size={20} color="#FFD700" />
        <Text style={[styles.actionButtonText, { color: '#FFD700' }]}>프리미엄</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.actionButton, styles.logoutButton]}
        onPress={handleLogout}
      >
        <MaterialCommunityIcons name="logout" size={20} color="#FF4757" />
        <Text style={[styles.actionButtonText, { color: '#FF4757' }]}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>프로필을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          user={userProfile}
          stats={stats}
          badges={badges}
          onEditPress={() => navigation.navigate('ProfileEdit')}
          onLikesPress={handleLikesPress}
          onMatchesPress={() => navigation.navigate('Matches')}
          onFriendsPress={() => setShowFriendsModal(true)}
          onGroupsPress={() => navigation.navigate('Groups')}
        />
        
        <ProfileInfoCards
          companyName={userProfile.companyName}
          education={userProfile.education}
          location={userProfile.location}
          interests={userProfile.interests}
          height={userProfile.height}
          mbti={userProfile.mbti}
          drinking={userProfile.drinking}
          smoking={userProfile.smoking}
        />
        
        {renderRecentActivity()}
        {renderActionButtons()}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Glimpse v1.0.0</Text>
          <Text style={styles.footerSubtext}>당신의 특별한 만남을 응원합니다</Text>
        </View>
      </ScrollView>
      
      <LikesReceivedModal
        visible={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        onLikePress={handleLikePress}
      />
      
      <FriendRequestsModal
        visible={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activitySection: {
    padding: SPACING.MD,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.MD,
  },
  activityList: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: SPACING.MD,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  activityText: {
    flex: 1,
    marginLeft: SPACING.SM,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.PRIMARY,
  },
  activityTime: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SPACING.MD,
    gap: SPACING.SM,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.MD,
    borderRadius: 12,
    gap: SPACING.XS,
  },
  settingsButton: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  premiumButton: {
    backgroundColor: '#FFD700' + '20',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  logoutButton: {
    backgroundColor: '#FF4757' + '20',
    borderWidth: 1,
    borderColor: '#FF4757',
  },
  actionButtonText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.XL,
    marginTop: SPACING.LG,
  },
  footerText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.LIGHT,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.LIGHT,
  },
});

export default ProfileScreenV2;