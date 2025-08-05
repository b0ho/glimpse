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
import { useNavigation } from '@react-navigation/native';
import { useLikeStore } from '@/store/slices/likeSlice';
import { useAuthStore } from '@/store/slices/authSlice';
import { Match } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { generateDummyMatches, dummyUserNicknames } from '@/utils/mockData';
import { formatTimeAgo } from '@/utils/dateUtils';

/**
 * 매칭 화면 컴포넌트 - 서로 좋아요한 사용자 목록
 * @component
 * @returns {JSX.Element} 매칭 화면 UI
 * @description 서로 좋아요를 보내 매칭된 사용자 목록을 표시하고 채팅을 시작할 수 있는 화면
 */
export const MatchesScreen: React.FC = React.memo(() => {
  console.log('[MatchesScreen] 컴포넌트 렌더링');
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigation = useNavigation();
  const likeStore = useLikeStore();
  const { user } = useAuthStore();

  /**
   * 매칭 데이터 로드
   * @effect
   * @description 서버에서 매칭 목록을 가져와 표시
   */
  useEffect(() => {
    console.log('[MatchesScreen] useEffect 실행됨');
    // 즉시 데이터 로드 (비동기 제거)
    try {
      const dummyMatches = generateDummyMatches();
      console.log('[MatchesScreen] dummyMatches 생성됨:', dummyMatches.length);
      setMatches(dummyMatches);
      likeStore.setMatches(dummyMatches);
      console.log('[MatchesScreen] setIsLoading(false) 호출');
      setIsLoading(false);
    } catch (error) {
      console.error('[MatchesScreen] Failed to load matches:', error);
      setIsLoading(false);
    }
  }, []); // dependency를 빈 배열로 변경하여 컴포넌트 마운트 시에만 실행

  /**
   * 채팅 시작 핸들러
   * @param {string} matchId - 매칭 ID
   * @param {string} nickname - 상대방 닉네임
   * @description 선택한 매칭과의 채팅 화면으로 이동
   */
  const handleStartChat = (matchId: string, nickname: string) => {
    // 채팅 화면으로 네비게이션
    const roomId = `room_${matchId}`;
    (navigation as { navigate: (screen: string, params: object) => void }).navigate('Chat', {
      roomId,
      matchId,
      otherUserNickname: nickname,
    });
  };


  /**
   * 매칭 아이템 렌더링
   * @param {Object} params - 리스트 아이템 파라미터
   * @param {Match} params.item - 매칭 객체
   * @returns {JSX.Element} 매칭 카드 UI
   * @description 각 매칭의 정보와 채팅 시작 버튼을 표시
   */
  const renderMatchItem = ({ item }: { item: Match }) => {
    const otherUserId = item.user1Id === user?.id ? item.user2Id : item.user1Id;
    
    // 익명성 시스템: 매칭된 상대방이므로 실명 표시
    const displayName = user?.id 
      ? likeStore.getUserDisplayName(otherUserId, user.id)
      : (dummyUserNicknames[otherUserId] || '익명사용자');

    return (
      <View style={styles.matchItem}>
        <View style={styles.matchHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {displayName.charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={styles.nickname}>{displayName}</Text>
              <Text style={styles.matchTime}>
                {formatTimeAgo(item.matchedAt || item.createdAt)}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => handleStartChat(item.id, displayName)}
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

  /**
   * 헤더 렌더링
   * @returns {JSX.Element} 헤더 UI
   * @description 매칭 통계와 안내 메시지를 표시
   */
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

  /**
   * 빈 상태 렌더링
   * @returns {JSX.Element} 빈 상태 UI
   * @description 매칭이 없을 때 표시되는 안내 UI
   */
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
});

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
    shadowColor: COLORS.SHADOW,
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