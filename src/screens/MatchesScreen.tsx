import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLikeStore } from '@/store/slices/likeSlice';
import { Match } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

// 임시 더미 매칭 데이터
const generateDummyMatches = (): Match[] => {
  return [
    {
      id: 'match_1',
      user1Id: 'current_user',
      user2Id: 'user_2',
      groupId: 'group_1',
      matchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전
      chatChannelId: 'chat_1',
    },
    {
      id: 'match_2',
      user1Id: 'current_user',
      user2Id: 'user_5',
      groupId: 'group_2',
      matchedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1일 전
      chatChannelId: 'chat_2',
    },
    {
      id: 'match_3',
      user1Id: 'current_user',
      user2Id: 'user_8',
      groupId: 'group_1',
      matchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3일 전
      chatChannelId: 'chat_3',
    },
  ];
};

const dummyUserNicknames: { [key: string]: string } = {
  user_2: '커피매니아',
  user_5: '독서광',
  user_8: '영화러버',
};

export const MatchesScreen: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const likeStore = useLikeStore();

  useEffect(() => {
    const loadMatches = async () => {
      setIsLoading(true);
      try {
        // 실제로는 API 호출
        await new Promise(resolve => setTimeout(resolve, 1000));
        const dummyMatches = generateDummyMatches();
        setMatches(dummyMatches);
        likeStore.setMatches(dummyMatches);
      } catch (error) {
        console.error('Failed to load matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMatches();
  }, [likeStore]);

  const handleStartChat = (matchId: string, nickname: string) => {
    console.log(`Starting chat with ${nickname} in match ${matchId}`);
    // 실제로는 채팅 화면으로 네비게이션
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return '방금 매칭';
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전 매칭`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}일 전 매칭`;
    }
  };

  const renderMatchItem = ({ item }: { item: Match }) => {
    const otherUserId = item.user1Id === 'current_user' ? item.user2Id : item.user1Id;
    const nickname = dummyUserNicknames[otherUserId] || '익명사용자';

    return (
      <View style={styles.matchItem}>
        <View style={styles.matchHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {nickname.charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={styles.nickname}>{nickname}</Text>
              <Text style={styles.matchTime}>
                {formatTimeAgo(item.matchedAt)}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => handleStartChat(item.id, nickname)}
          >
            <Text style={styles.chatButtonText}>채팅하기</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.matchDescription}>
          서로 좋아요를 보내서 매칭되었어요! 💕{'\n'}
          지금부터 서로의 닉네임을 확인할 수 있습니다.
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>매칭</Text>
      <Text style={styles.headerSubtitle}>
        서로 좋아요를 보낸 사람들과 대화해보세요
      </Text>
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          총 매칭: {matches.length}명
        </Text>
        <Text style={styles.statsText}>
          받은 좋아요: {likeStore.getReceivedLikesCount()}개
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateEmoji}>💕</Text>
      <Text style={styles.emptyStateTitle}>아직 매칭된 사람이 없어요</Text>
      <Text style={styles.emptyStateSubtitle}>
        홈 피드에서 마음에 드는 게시물에{'\n'}
        좋아요를 보내보세요!{'\n\n'}
        서로 좋아요를 보내면 매칭됩니다.
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>매칭 정보를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={renderMatchItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={matches.length === 0 ? styles.emptyContainer : undefined}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
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
    marginBottom: SPACING.MD,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  matchItem: {
    backgroundColor: COLORS.SURFACE,
    marginVertical: SPACING.XS,
    marginHorizontal: SPACING.MD,
    borderRadius: 12,
    padding: SPACING.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  avatarText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
  },
  nickname: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 2,
  },
  matchTime: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
  },
  chatButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
  },
  chatButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  matchDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: SPACING.LG,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
  },
});