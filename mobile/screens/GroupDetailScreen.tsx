import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Share,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { useGroupStore } from '@/store/slices/groupSlice';
import { LinearGradient } from 'expo-linear-gradient';

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
  const { groupId } = route.params;
  const { groups, joinGroup, leaveGroup, getOrCreateInviteCode, isUserInGroup } = useGroupStore();
  
  const [group, setGroup] = useState<any>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState<string>('');

  useEffect(() => {
    loadGroupDetail();
  }, [groupId]);

  const loadGroupDetail = async () => {
    // Mock 데이터 - 실제로는 API 호출
    const mockGroup = {
      id: groupId,
      name: '서강대학교',
      type: 'OFFICIAL',
      description: '서강대학교 공식 그룹입니다. 재학생 및 졸업생들이 참여할 수 있습니다.',
      memberCount: 1234,
      postCount: 567,
      createdAt: '2024-01-01',
      coverImage: `https://picsum.photos/400/200?random=${groupId}`,
      category: '대학교',
      isJoined: groups.find(g => g.id === groupId)?.isJoined || false,
      members: [
        { id: '1', nickname: '익명1', profileImage: 'https://picsum.photos/100/100?random=1' },
        { id: '2', nickname: '익명2', profileImage: 'https://picsum.photos/100/100?random=2' },
        { id: '3', nickname: '익명3', profileImage: 'https://picsum.photos/100/100?random=3' },
        { id: '4', nickname: '익명4', profileImage: 'https://picsum.photos/100/100?random=4' },
      ],
      recentPosts: [
        { id: '1', title: '스터디 모집합니다', author: '익명1', createdAt: '2시간 전', likes: 12 },
        { id: '2', title: '학교 근처 맛집 추천', author: '익명2', createdAt: '5시간 전', likes: 34 },
        { id: '3', title: '중고책 판매합니다', author: '익명3', createdAt: '1일 전', likes: 8 },
      ],
    };

    setGroup(mockGroup);
    setIsJoined(mockGroup.isJoined);
    setLoading(false);
  };

  const handleJoinLeave = async () => {
    if (isJoined) {
      Alert.alert(
        '그룹 나가기',
        '정말 이 그룹을 나가시겠습니까?\n그룹 채팅방에서도 함께 나가게 됩니다.',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '나가기',
            style: 'destructive',
            onPress: async () => {
              try {
                // Store에서 그룹 나가기 처리 (API 호출 포함)
                await leaveGroup(groupId);
                setIsJoined(false);
                // 그룹 정보 업데이트
                setGroup({ ...group, memberCount: group.memberCount - 1 });
                Alert.alert('알림', '그룹을 나갔습니다.');
                navigation.goBack();
              } catch (error) {
                Alert.alert('오류', '그룹 나가기에 실패했습니다.');
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
        Alert.alert('알림', '그룹에 참여했습니다.');
      } catch (error) {
        Alert.alert('오류', '그룹 참여에 실패했습니다.');
      }
    }
  };

  const handleInviteCode = async () => {
    if (!isJoined) {
      Alert.alert('알림', '그룹에 참여한 후 초대코드를 생성할 수 있습니다.');
      return;
    }
    
    try {
      const code = await getOrCreateInviteCode(groupId);
      setInviteCode(code);
      setShowInviteModal(true);
    } catch (error) {
      Alert.alert('오류', '초대코드 생성에 실패했습니다.');
    }
  };

  const handleShareInviteCode = async () => {
    try {
      const message = `${group.name} 그룹에 초대합니다!\n\n초대코드: ${inviteCode}\n\nGlimpse 앱에서 초대코드를 입력하여 그룹에 참여하세요!`;
      
      await Share.share({
        message,
        title: '그룹 초대',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleGroupChat = () => {
    if (!isJoined) {
      Alert.alert('알림', '그룹에 참여한 후 채팅에 참여할 수 있습니다.');
      return;
    }
    navigation.navigate('Chat', {
      roomId: `group-${groupId}`,
      matchId: groupId,
      otherUserNickname: group?.name || '그룹 채팅',
      isGroupChat: true,
    });
  };

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
          그룹을 찾을 수 없습니다.
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
            그룹 상세
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
              멤버 {group.memberCount}명
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
              {isJoined ? '그룹 나가기' : '그룹 참여하기'}
            </Text>
          </TouchableOpacity>

          {isJoined && (
            <>
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: colors.SUCCESS }]}
                onPress={handleGroupChat}
              >
                <Icon name="chatbubbles" size={20} color="#FFFFFF" />
                <Text style={styles.secondaryButtonText}>그룹 채팅 참여</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: colors.PRIMARY + '20' }]}
                onPress={handleInviteCode}
              >
                <Icon name="share-social" size={20} color={colors.PRIMARY} />
                <Text style={[styles.secondaryButtonText, { color: colors.PRIMARY }]}>초대코드 공유</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 멤버 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            활동 중인 멤버
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
            최근 게시물
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
              그룹 초대코드
            </Text>
            
            <View style={[styles.inviteCodeBox, { backgroundColor: colors.BACKGROUND }]}>
              <Text style={[styles.inviteCodeText, { color: colors.PRIMARY }]}>
                {inviteCode}
              </Text>
            </View>
            
            <Text style={[styles.modalDescription, { color: colors.TEXT.SECONDARY }]}>
              이 코드를 친구와 공유하여 그룹에 초대하세요
            </Text>
            
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: colors.PRIMARY }]}
              onPress={handleShareInviteCode}
            >
              <Icon name="share-social" size={20} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>SNS로 공유하기</Text>
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