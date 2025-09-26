import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
  Modal,
} from 'react-native';
import { showAlert } from '@/utils/webAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { useGroupStore } from '@/store/slices/groupSlice';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { LinearGradient } from 'expo-linear-gradient';
import { ServerConnectionError } from '@/components/ServerConnectionError';
import { apiClient } from '@/services/api/config';

interface GroupDetailScreenProps {
  route: {
    params: {
      groupId: string;
    };
  };
}

/**
 * 그룹 상세 화면
 */
export const GroupDetailScreen: React.FC<GroupDetailScreenProps> = ({ route }) => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation(['group', 'common']);
  const { groupId } = route.params;
  const { groups, joinGroup, leaveGroup, getOrCreateInviteCode, isUserInGroup } = useGroupStore();
  
  const [group, setGroup] = useState<any>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [serverConnectionError, setServerConnectionError] = useState(false);

  useEffect(() => {
    loadGroupDetail();
  }, [groupId]);

  const loadGroupDetail = async () => {
    setLoading(true);
    setServerConnectionError(false);
    try {
      // 실제 API 호출
      const response = await apiClient.get<any>(`/groups/${groupId}`);
      
      if (response.success && response.data) {
        setGroup(response.data);
        setIsJoined(response.data.isJoined || false);
      } else {
        // API 응답은 있지만 데이터가 없는 경우
        setGroup(null);
        setServerConnectionError(true);
      }
    } catch (error) {
      console.error('Failed to load group detail:', error);
      setGroup(null);
      setServerConnectionError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeave = async () => {
    if (isJoined) {
      showAlert(
        t('detail.alerts.leaveConfirm.title'),
        t('detail.alerts.leaveConfirm.message'),
        [
          { text: t('detail.alerts.leaveConfirm.cancel'), style: 'cancel' },
          {
            text: t('detail.alerts.leaveConfirm.confirm'),
            style: 'destructive',
            onPress: async () => {
              try {
                // Store에서 그룹 나가기 처리 (API 호출 포함)
                await leaveGroup(groupId);
                setIsJoined(false);
                // 그룹 정보 업데이트
                setGroup({ ...group, memberCount: group.memberCount - 1 });
                showAlert(t('detail.alerts.leaveSuccess.title'), t('detail.alerts.leaveSuccess.message'));
                navigation.goBack();
              } catch (error) {
                showAlert(t('detail.alerts.leaveError.title'), t('detail.alerts.leaveError.message'));
              }
            },
          },
        ],
      );
    } else {
      try {
        // Store에 그룹 추가 (API 호출 포함)
        await joinGroup(groupId);
        setIsJoined(true);
        // 그룹 정보 업데이트
        setGroup({ ...group, memberCount: group.memberCount + 1 });
        showAlert(t('detail.alerts.joinSuccess.title'), t('detail.alerts.joinSuccess.message'));
      } catch (error) {
        showAlert(t('detail.alerts.joinError.title'), t('detail.alerts.joinError.message'));
      }
    }
  };

  const handleInviteCode = async () => {
    if (!isJoined) {
      showAlert(t('detail.alerts.inviteCodeRequiresJoin.title'), t('detail.alerts.inviteCodeRequiresJoin.message'));
      return;
    }
    
    try {
      const code = await getOrCreateInviteCode(groupId);
      setInviteCode(code);
      setShowInviteModal(true);
    } catch (error) {
      showAlert(t('detail.alerts.inviteCodeError.title'), t('detail.alerts.inviteCodeError.message'));
    }
  };

  const handleShareInviteCode = async () => {
    try {
      const message = t('detail.shareInviteMessage', { groupName: group.name, inviteCode });
      
      await Share.share({
        message,
        title: t('detail.shareInviteTitle'),
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleGroupChat = () => {
    if (!isJoined) {
      showAlert(t('detail.alerts.chatRequiresJoin.title'), t('detail.alerts.chatRequiresJoin.message'));
      return;
    }
    navigation.navigate('Chat', {
      roomId: `group-${groupId}`,
      matchId: groupId,
      otherUserNickname: group?.name || t('detail.chatButton'),
      isGroupChat: true,
    });
  };

  // 서버 연결 에러 시 에러 화면 표시
  if (serverConnectionError) {
    return (
      <ServerConnectionError 
        onRetry={() => {
          setServerConnectionError(false);
          loadGroupDetail();
        }}
        message={t('common:errors.loadErrors.groupDetail')}
      />
    );
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.BACKGROUND }]}>
        <ActivityIndicator size="large" color={colors.PRIMARY} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.BACKGROUND }]}>
        <Text style={[styles.errorText, { color: colors.TEXT.PRIMARY }]}>
          {t('detail.notFound')}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={28} color={colors.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('detail.title')}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* 커버 이미지 */}
        <Image source={{ uri: group.coverImage }} style={styles.coverImage} />

        {/* 그룹 정보 */}
        <View style={styles.groupInfo}>
          <Text style={[styles.groupName, { color: colors.TEXT.PRIMARY }]}>
            {group.name}
          </Text>
          <View style={styles.groupMeta}>
            <View style={[styles.badge, { backgroundColor: colors.PRIMARY + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.PRIMARY }]}>
                {group.category}
              </Text>
            </View>
            <Text style={[styles.memberCount, { color: colors.TEXT.SECONDARY }]}>
              {t('detail.memberCount', { count: group.memberCount })}
            </Text>
          </View>
          <Text style={[styles.description, { color: colors.TEXT.SECONDARY }]}>
            {group.description}
          </Text>
        </View>

        {/* 액션 버튼 */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.mainButton,
              { backgroundColor: isJoined ? colors.ERROR : colors.PRIMARY },
            ]}
            onPress={handleJoinLeave}
          >
            <Icon 
              name={isJoined ? "exit-outline" : "enter-outline"} 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={styles.mainButtonText}>
              {isJoined ? t('detail.leaveButton') : t('detail.joinButton')}
            </Text>
          </TouchableOpacity>

          {isJoined && (
            <>
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: colors.SUCCESS }]}
                onPress={handleGroupChat}
              >
                <Icon name="chatbubbles" size={20} color="#FFFFFF" />
                <Text style={styles.secondaryButtonText}>{t('detail.chatButton')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: colors.PRIMARY + '20' }]}
                onPress={handleInviteCode}
              >
                <Icon name="share-social" size={20} color={colors.PRIMARY} />
                <Text style={[styles.secondaryButtonText, { color: colors.PRIMARY }]}>{t('detail.inviteButton')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 멤버 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('detail.activeMembersTitle')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {group.members.map((member: any) => (
              <View key={member.id} style={styles.memberCard}>
                <Image source={{ uri: member.profileImage }} style={styles.memberImage} />
                <Text style={[styles.memberName, { color: colors.TEXT.SECONDARY }]}>
                  {member.nickname}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 최근 게시물 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('detail.recentPostsTitle')}
          </Text>
          {group.recentPosts.map((post: any) => (
            <TouchableOpacity
              key={post.id}
              style={[styles.postCard, { backgroundColor: colors.SURFACE }]}
            >
              <Text style={[styles.postTitle, { color: colors.TEXT.PRIMARY }]}>
                {post.title}
              </Text>
              <View style={styles.postMeta}>
                <Text style={[styles.postAuthor, { color: colors.TEXT.TERTIARY }]}>
                  {post.author}
                </Text>
                <Text style={[styles.postTime, { color: colors.TEXT.TERTIARY }]}>
                  {post.createdAt}
                </Text>
                <View style={styles.postLikes}>
                  <Icon name="heart-outline" size={14} color={colors.TEXT.TERTIARY} />
                  <Text style={[styles.postLikesCount, { color: colors.TEXT.TERTIARY }]}>
                    {post.likes}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 초대코드 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showInviteModal}
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.SURFACE }]}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowInviteModal(false)}
            >
              <Icon name="close" size={24} color={colors.TEXT.PRIMARY} />
            </TouchableOpacity>
            
            <Text style={[styles.modalTitle, { color: colors.TEXT.PRIMARY }]}>
              {t('detail.inviteCodeTitle')}
            </Text>
            
            <View style={[styles.inviteCodeBox, { backgroundColor: colors.BACKGROUND }]}>
              <Text style={[styles.inviteCodeText, { color: colors.PRIMARY }]}>
                {inviteCode}
              </Text>
            </View>
            
            <Text style={[styles.modalDescription, { color: colors.TEXT.SECONDARY }]}>
              {t('detail.inviteCodeDescription')}
            </Text>
            
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: colors.PRIMARY }]}
              onPress={handleShareInviteCode}
            >
              <Icon name="share-social" size={20} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>{t('detail.shareToSNS')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  coverImage: {
    width: '100%',
    height: 200,
  },
  groupInfo: {
    padding: 20,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  memberCount: {
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  inviteCodeBox: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  inviteCodeText: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
  },
  modalDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
  },
  memberCard: {
    alignItems: 'center',
    marginRight: 15,
  },
  memberImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 5,
  },
  memberName: {
    fontSize: 12,
  },
  postCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAuthor: {
    fontSize: 12,
    marginRight: 10,
  },
  postTime: {
    fontSize: 12,
    flex: 1,
  },
  postLikes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postLikesCount: {
    fontSize: 12,
    marginLeft: 4,
  },
});