import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '@/store/slices/authSlice';
import { useLikeStore } from '@/store/slices/likeSlice';
import { ContentItem } from '@/components/ContentItem';
import { StoryList } from '@/components/story/StoryList';
import { StoryViewer } from '@/components/story/StoryViewer';
import { storyService, StoryGroup } from '@/services/storyService';
import { Content } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { generateDummyContent } from '@/utils/mockData';
import { ACTION_ICONS } from '@/utils/icons';

/**
 * 홈 스크린 컴포넌트 - 메인 피드 및 스토리 표시
 * @component
 * @returns {JSX.Element} 홈 스크린 UI
 * @description 사용자의 메인 피드, 스토리, 좋아요 기능을 제공하는 홈 화면
 */
export const HomeScreen = () => {
  const [contents, setContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  
  // Story states
  const [stories, setStories] = useState<StoryGroup[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  
  const navigation = useNavigation() as any;
  const authStore = useAuthStore();
  const likeStore = useLikeStore();

  /**
   * 좋아요 토글 핸들러
   * @param {string} contentId - 콘텐츠 ID
   * @param {string} authorId - 작성자 ID
   * @returns {Promise<void>}
   * @description 콘텐츠에 좋아요를 보내거나 취소하는 함수
   */
  const handleLikeToggle = useCallback(async (contentId: string, authorId: string) => {
    const content = contents.find(c => c.id === contentId);
    if (!content) return;

    // 자기 자신의 콘텐츠에는 좋아요 불가
    if (authorId === authStore.user?.id) {
      Alert.alert('알림', '자신의 게시물에는 좋아요를 누를 수 없습니다.');
      return;
    }

    // 이미 좋아요를 눌렀다면
    if (content.isLikedByUser) {
      Alert.alert('알림', '이미 좋아요를 누른 게시물입니다.');
      return;
    }

    // 일일 좋아요 한도 체크
    if (!likeStore.canSendLike(authorId)) {
      const remainingLikes = likeStore.getRemainingFreeLikes();
      if (remainingLikes === 0) {
        Alert.alert(
          '좋아요 한도 초과',
          '오늘의 무료 좋아요를 모두 사용했습니다.\n추가 좋아요는 결제를 통해 구매할 수 있습니다.',
          [
            { text: '취소', style: 'cancel' },
            { text: '구매하기', onPress: () => console.log('Navigate to purchase') },
          ]
        );
        return;
      } else {
        Alert.alert('알림', '2주 이내에 이미 좋아요를 보낸 사용자입니다.');
        return;
      }
    }

    try {
      // 좋아요 보내기 (Zustand store 사용)
      // TODO: Content doesn't have groupId - need to handle this differently
      const success = await likeStore.sendLike(authorId, 'default_group_id');
      
      if (success) {
        // 로컬 상태 업데이트 (optimistic update)
        setContents(prevContents => 
          prevContents.map(c => 
            c.id === contentId 
              ? { ...c, likeCount: (c.likeCount || 0) + 1, isLikedByUser: true }
              : c
          )
        );

        Alert.alert(
          '좋아요 전송 완료! 💕',
          `${content.authorNickname}님에게 익명으로 좋아요를 보냈습니다.\n서로 좋아요를 보내면 매칭됩니다!`
        );
      }
    } catch (error) {
      console.error('Like toggle error:', error);
      Alert.alert('오류', '좋아요 처리 중 오류가 발생했습니다.');
    }
  }, [contents, authStore.user?.id, likeStore]);

  /**
   * 스토리 목록 로드
   * @returns {Promise<void>}
   * @description 피드에 표시할 스토리 목록을 가져오는 함수
   */
  const loadStories = useCallback(async () => {
    try {
      setStoriesLoading(true);
      
      // 더미 스토리 데이터 사용 (API 대신)
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // 빈 스토리 배열로 설정 (스토리 기능 비활성화)
      setStories([]);
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      setStoriesLoading(false);
    }
  }, [authStore.user]);

  /**
   * 스토리 선택 핸들러
   * @param {number} index - 선택된 스토리 인덱스
   * @description 스토리를 선택하여 뷰어를 여는 함수
   */
  const handleStoryPress = useCallback((index: number) => {
    setSelectedStoryIndex(index);
    setShowStoryViewer(true);
  }, []);

  /**
   * 스토리 추가 핸들러
   * @description 새 스토리 업로드 화면으로 이동하는 함수
   */
  const handleAddStoryPress = useCallback(() => {
    navigation.navigate('StoryUpload');
  }, [navigation]);

  /**
   * 스토리 조회 처리 핸들러
   * @param {string} storyId - 스토리 ID
   * @returns {Promise<void>}
   * @description 스토리를 조회 처리하는 함수
   */
  const handleViewStory = useCallback(async (storyId: string) => {
    try {
      await storyService.viewStory(storyId);
    } catch (error) {
      console.error('Failed to mark story as viewed:', error);
    }
  }, []);

  /**
   * 콘텐츠 목록 로드
   * @param {boolean} refresh - 새로고침 여부
   * @returns {Promise<void>}
   * @description 피드에 표시할 콘텐츠 목록을 가져오는 함수
   */
  const loadContents = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // 더미 데이터를 바로 사용 (로딩 시간 단축)
      const dummyContents = generateDummyContent();
      
      // 짧은 로딩 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (refresh) {
        setContents(dummyContents);
      } else {
        setContents(dummyContents);
      }
    } catch (error) {
      console.error('Failed to load contents:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  /**
   * 추가 콘텐츠 로드 (무한 스크롤)
   * @returns {Promise<void>}
   * @description 스크롤 끝에 도달했을 때 추가 콘텐츠를 로드하는 함수
   */
  const loadMoreContents = useCallback(async () => {
    if (!hasMoreData || isLoading) return;

    try {
      // 실제로는 다음 페이지 API 호출
      console.log('Loading more contents...');
      // 임시로 더 이상 로드할 데이터가 없다고 설정
      setHasMoreData(false);
    } catch (error) {
      console.error('Failed to load more contents:', error);
    }
  }, [hasMoreData, isLoading]);

  useEffect(() => {
    // 더미 데이터를 바로 설정 (API 호출 없이)
    const dummyContents = generateDummyContent();
    setContents(dummyContents);
    setIsLoading(false);
    setStoriesLoading(false);
    setStories([]);
  }, []);

  /**
   * 헤더 렌더링
   * @returns {JSX.Element} 헤더 UI
   * @description 앱 타이틀, 사용자 정보, 통계를 표시하는 헤더
   */
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Glimpse</Text>
      <Text style={styles.headerSubtitle}>
        안녕하세요, {authStore.user?.nickname || '사용자'}님! 👋
      </Text>
      <View style={styles.headerStats}>
        <Text style={styles.statsText}>
          받은 좋아요: {likeStore.getReceivedLikesCount()}개
        </Text>
        <Text style={styles.statsText}>
          남은 좋아요: {likeStore.getRemainingFreeLikes()}개
        </Text>
      </View>
      
      {/* 위치 기반 기능 버튼 */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={() => navigation.navigate('LocationGroup' as never)}
      >
        <Icon name="location" size={20} color={COLORS.PRIMARY} />
        <Text style={styles.locationButtonText}>근처 그룹 및 사용자</Text>
        <Icon name="chevron-forward" size={16} color={COLORS.TEXT.SECONDARY} />
      </TouchableOpacity>
    </View>
  );

  /**
   * 콘텐츠 아이템 렌더링
   * @param {Object} params - 리스트 아이템 파라미터
   * @param {Content} params.item - 콘텐츠 객체
   * @returns {JSX.Element} 콘텐츠 아이템 UI
   */
  const renderContentItem = ({ item }: { item: Content }) => (
    <ContentItem
      item={item}
      currentUserId={authStore.user?.id}
      remainingLikes={likeStore.getRemainingFreeLikes()}
      onLikeToggle={handleLikeToggle}
    />
  );

  /**
   * 빈 상태 렌더링
   * @returns {JSX.Element} 빈 상태 UI
   * @description 콘텐츠가 없을 때 표시되는 UI
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateEmoji}>📱</Text>
      <Text style={styles.emptyStateTitle}>아직 콘텐츠가 없어요</Text>
      <Text style={styles.emptyStateSubtitle}>
        그룹에 참여하거나 첫 번째 게시물을 작성해보세요!
      </Text>
    </View>
  );

  /**
   * 풋터 렌더링
   * @returns {JSX.Element | null} 풋터 UI
   * @description 무한 스크롤 로딩 표시
   */
  const renderFooter = () => {
    if (!hasMoreData) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>더 많은 콘텐츠를 불러오는 중...</Text>
      </View>
    );
  };

  if (isLoading && contents.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>콘텐츠를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={contents}
        keyExtractor={(item) => item.id}
        renderItem={renderContentItem}
        ListHeaderComponent={
          <>
            {/* Stories */}
            <StoryList
              stories={stories}
              onStoryPress={handleStoryPress}
              onAddStoryPress={handleAddStoryPress}
              currentUserId={authStore.user?.id || ''}
              isLoading={storiesLoading}
              onRefresh={loadStories}
              refreshing={false}
            />
            {renderHeader()}
          </>
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              loadContents(true);
              loadStories();
            }}
            colors={[COLORS.PRIMARY]}
            tintColor={COLORS.PRIMARY}
          />
        }
        onEndReached={loadMoreContents}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={contents.length === 0 ? styles.emptyContainer : undefined}
      />
      
      {/* Story Viewer Modal */}
      <Modal
        visible={showStoryViewer}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowStoryViewer(false)}
      >
        {stories.length > 0 && (
          <StoryViewer
            storyGroups={stories}
            initialGroupIndex={selectedStoryIndex}
            onClose={() => setShowStoryViewer(false)}
            onViewStory={handleViewStory}
            currentUserId={authStore.user?.id || ''}
          />
        )}
      </Modal>
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateContent' as never)}
        activeOpacity={0.8}
        accessibilityLabel="새 게시물 작성"
        accessibilityHint="새로운 콘텐츠를 작성할 수 있는 화면으로 이동합니다"
        accessibilityRole="button"
      >
        <Icon name={ACTION_ICONS.CREATE} color="white" size={28} />
      </TouchableOpacity>
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
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: SPACING.MD,
    marginTop: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY + '20',
  },
  locationButtonText: {
    flex: 1,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '500',
    marginLeft: SPACING.SM,
  },
  statsText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
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
  loadingFooter: {
    paddingVertical: SPACING.LG,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});