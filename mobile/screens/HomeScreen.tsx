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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import i18n from '@/services/i18n/i18n';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '@/store/slices/authSlice';
import { useLikeStore } from '@/store/slices/likeSlice';
import { useGroupStore } from '@/store/slices/groupSlice';
import { useTheme } from '@/hooks/useTheme';
import { ContentItem } from '@/components/ContentItem';
import { StoryList } from '@/components/story/StoryList';
import { StoryFullViewer } from '@/components/story/StoryFullViewer';
import { storyService, StoryGroup } from '@/services/storyService';
import { getStoriesByUser, StoryUser } from '@/utils/storyData';
import { Content } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { contentApi } from '@/services/api/contentApi';
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
  const [stories, setStories] = useState<StoryUser[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  
  const navigation = useNavigation() as any;
  const authStore = useAuthStore();
  
  // 웹에서 페이지 타이틀 설정
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Glimpse - 당신의 이상형을 찾아보세요';
    }
  }, []);
  const likeStore = useLikeStore();
  const groupStore = useGroupStore();
  const { colors } = useTheme();
  const { t } = useTranslation();

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
      Alert.alert(t('common:status.notification'), t('matching:like.selfLikeNotAllowed'));
      return;
    }

    // 이미 좋아요를 눌렀다면
    if (content.isLikedByUser) {
      Alert.alert(t('common:status.notification'), t('matching:like.alreadyLiked'));
      return;
    }

    // 일일 좋아요 한도 체크
    if (!likeStore.canSendLike(authorId)) {
      const remainingLikes = likeStore.getRemainingFreeLikes();
      if (remainingLikes === 0) {
        Alert.alert(
          t('matching:like.limitExceeded'),
          t('matching:like.dailyLimitMessage'),
          [
            { text: t('common:buttons.cancel'), style: 'cancel' },
            { text: t('matching:like.buyMoreLikes'), onPress: () => navigation.navigate('Premium') },
          ]
        );
        return;
      } else {
        Alert.alert(t('common:status.notification'), t('matching:like.cooldownMessage', { days: 14 }));
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
          t('home:likeMessage.title'),
          t('home:likeMessage.description', { name: content.authorNickname })
        );
      }
    } catch (error) {
      console.error('Like toggle error:', error);
      Alert.alert(t('common:status.error'), t('home:errors.likeError'));
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
      
      const currentUserId = authStore.user?.id || 'current_user';
      console.log('[HomeScreen] 스토리 로드 시작, userId:', currentUserId);
      
      const storyUsers = await getStoriesByUser(currentUserId);
      console.log('[HomeScreen] 스토리 로드 완료:', storyUsers.length, '명의 사용자');
      
      setStories(storyUsers);
    } catch (error) {
      console.error('[HomeScreen] 스토리 로드 실패:', error);
      setStories([]);
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
   * 콘텐츠 수정 핸들러
   * @param {Content} content - 수정할 콘텐츠
   */
  const handleEditContent = useCallback((content: Content) => {
    // CreateContentScreen으로 이동하면서 수정 모드로 전환
    navigation.navigate('CreateContent' as never, { editingContent: content } as never);
  }, [navigation]);

  /**
   * 콘텐츠 삭제 핸들러
   * @param {string} contentId - 삭제할 콘텐츠 ID
   */
  const handleDeleteContent = useCallback(async (contentId: string) => {
    try {
      await contentApi.deleteContent(contentId);
      
      // 로컬 상태에서 해당 콘텐츠 제거
      setContents(prevContents => prevContents.filter(content => content.id !== contentId));
      
      Alert.alert('삭제 완료', '게시물이 삭제되었습니다.');
    } catch (error) {
      console.error('Content delete error:', error);
      Alert.alert('삭제 실패', '게시물 삭제에 실패했습니다.');
    }
  }, []);

  /**
   * 스토리 추가 핸들러
   * @description 새 스토리 생성 화면으로 이동하는 함수
   */
  const handleAddStoryPress = useCallback(() => {
    navigation.navigate('CreateStory' as never);
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
    console.log('[HomeScreen] loadContents called, refresh:', refresh);
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // 실제 API 호출로 콘텐츠 가져오기
      console.log('[HomeScreen] Calling API...');
      const apiContents = await contentApi.getContents(undefined, 1, 20);
      console.log('[HomeScreen] API response:', apiContents);
      
      // API 응답이 없거나 에러인 경우 테스트 데이터 사용
      if (!apiContents || apiContents.length === 0) {
        const testContents: Content[] = [
          {
            id: '1',
            userId: 'user1',
            authorId: 'user1',
            authorNickname: i18n.language === 'ko' ? '커피러버' : 'Coffee Lover',
            type: 'text',
            text: i18n.language === 'ko' 
              ? '오늘 날씨가 너무 좋네요! 다들 좋은 하루 되세요 ☀️' 
              : 'The weather is so nice today! Have a great day everyone ☀️',
            imageUrls: [],
            likes: 12,
            likeCount: 12,
            views: 45,
            isPublic: true,
            isLikedByUser: false,
            groupId: 'group1', // 그룹 ID 추가
            createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          },
          {
            id: '2',
            userId: 'user2',
            authorId: 'user2',
            authorNickname: i18n.language === 'ko' ? '개발자' : 'Developer',
            type: 'text',
            text: i18n.language === 'ko'
              ? '새로운 프로젝트 시작했습니다! 화이팅 💪'
              : 'Started a new project! Fighting 💪',
            imageUrls: [],
            likes: 8,
            likeCount: 8,
            views: 32,
            isPublic: true,
            isLikedByUser: false,
            groupId: 'group2', // 그룹 ID 추가
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '3',
            userId: 'user3',
            authorId: 'user3',
            authorNickname: i18n.language === 'ko' ? '운동매니아' : 'Fitness Enthusiast',
            type: 'text',
            text: i18n.language === 'ko'
              ? '오늘도 헬스장 다녀왔습니다! 운동하면 기분이 좋아져요 🏋️'
              : 'Went to the gym today! Exercise makes me feel good 🏋️',
            imageUrls: [],
            likes: 15,
            likeCount: 15,
            views: 67,
            isPublic: true,
            isLikedByUser: true,
            groupId: 'group3', // 그룹 ID 추가
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '4',
            userId: 'user4',
            authorId: 'user4',
            authorNickname: i18n.language === 'ko' ? '맛집탐방' : 'Foodie Explorer',
            type: 'text',
            text: i18n.language === 'ko'
              ? '강남역 근처 맛집 추천해주세요! 🍜'
              : 'Please recommend good restaurants near Gangnam Station! 🍜',
            imageUrls: [],
            likes: 23,
            likeCount: 23,
            views: 89,
            isPublic: true,
            isLikedByUser: false,
            groupId: 'group1', // 그룹 ID 추가 (기존 그룹 재사용)
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '5',
            userId: 'user5',
            authorId: 'user5',
            authorNickname: i18n.language === 'ko' ? '책벌레' : 'Bookworm',
            type: 'text',
            text: i18n.language === 'ko'
              ? '이번 주말에 읽을 책 추천 받습니다 📚 장르는 소설이면 좋겠어요!'
              : 'Looking for book recommendations for this weekend 📚 Preferably fiction!',
            imageUrls: [],
            likes: 10,
            likeCount: 10,
            views: 54,
            isPublic: true,
            isLikedByUser: false,
            groupId: 'group4', // 그룹 ID 추가
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
        
        console.log('[HomeScreen] Using test contents');
        setContents(testContents);
        setHasMoreData(false);
        return;
      }
      
      console.log('[HomeScreen] Setting real contents:', apiContents.length);
      setContents(apiContents);
      setHasMoreData(apiContents.length >= 20);
    } catch (error) {
      console.error('[HomeScreen] Content load failed:', error);
      Alert.alert(t('common:status.error'), t('home:errors.loadError'));
      
      // 에러 시에도 테스트 데이터 표시
      const testContents: Content[] = [
        {
          id: '1',
          userId: 'user1',
          authorId: 'user1',
          authorNickname: i18n.language === 'ko' ? '커피러버' : 'Coffee Lover',
          type: 'text',
          text: i18n.language === 'ko' 
            ? '오늘 날씨가 너무 좋네요! 다들 좋은 하루 되세요 ☀️' 
            : 'The weather is so nice today! Have a great day everyone ☀️',
          imageUrls: [],
          likes: 12,
          likeCount: 12,
          views: 45,
          isPublic: true,
          isLikedByUser: false,
          groupId: 'group1', // 그룹 ID 추가
          createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        },
      ];
      setContents(testContents);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

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
    // 컴포넌트 마운트 시 콘텐츠 로드
    loadContents();
    
    // 스토리 로드
    loadStories();
  }, []); // 빈 배열로 변경하여 마운트 시 한 번만 실행

  // 화면에 포커스될 때마다 콘텐츠 새로고침 (스토리 작성 후 등)
  useFocusEffect(
    useCallback(() => {
      console.log('[HomeScreen] 화면 포커스 - 콘텐츠 및 스토리 새로고침');
      // 초기 로딩이 아닌 경우에만 새로고침
      if (!isLoading && contents.length > 0) {
        loadContents(true);
        loadStories();
      }
      return () => {
        // cleanup
      };
    }, []) // 빈 배열로 변경
  );

  /**
   * 헤더 렌더링
   * @returns {JSX.Element} 헤더 UI
   * @description 앱 타이틀, 사용자 정보, 통계를 표시하는 헤더
   */
  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
      <Text style={[styles.headerTitle, { color: colors.PRIMARY }]}>Glimpse</Text>
      <Text style={[styles.headerSubtitle, { color: colors.TEXT.PRIMARY }]}>
        {t('home:header.greeting', { name: authStore.user?.nickname || t('common:user.defaultName', '사용자') })}
      </Text>
      <View style={styles.headerStats}>
        <Text style={[styles.statsText, { color: colors.TEXT.SECONDARY }]}>
          {t('home:header.receivedLikes', { count: likeStore.getReceivedLikesCount() })}
        </Text>
        <Text style={[styles.statsText, { color: colors.TEXT.SECONDARY }]}>
          {t('home:header.remainingLikes', { count: likeStore.getRemainingFreeLikes() })}
        </Text>
      </View>
      
      {/* 위치 기반 기능 버튼들 */}
      <View style={styles.locationButtonsContainer}>
        <TouchableOpacity
          style={[styles.locationButton, { backgroundColor: colors.SURFACE, borderColor: colors.PRIMARY + '20' }]}
          onPress={() => navigation.navigate('NearbyGroups' as never)}
        >
          <Icon name="location-outline" size={20} color={colors.PRIMARY} />
          <Text style={[styles.locationButtonText, { color: colors.TEXT.PRIMARY }]}>근처 그룹</Text>
          <Icon name="chevron-forward" size={16} color={colors.TEXT.SECONDARY} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.locationButton, { backgroundColor: colors.SURFACE, borderColor: colors.PRIMARY + '20' }]}
          onPress={() => navigation.navigate('NearbyUsers' as never)}
        >
          <Icon name="people-outline" size={20} color={colors.PRIMARY} />
          <Text style={[styles.locationButtonText, { color: colors.TEXT.PRIMARY }]}>근처 사용자</Text>
          <Icon name="chevron-forward" size={16} color={colors.TEXT.SECONDARY} />
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * 콘텐츠 아이템 렌더링
   * @param {Object} params - 리스트 아이템 파라미터
   * @param {Content} params.item - 콘텐츠 객체
   * @returns {JSX.Element} 콘텐츠 아이템 UI
   */
  const renderContentItem = ({ item }: { item: Content }) => {
    // 그룹 정보 찾기 (디버깅 로그 추가)
    console.log('[HomeScreen] 콘텐츠 그룹 찾기:', {
      contentId: item.id,
      contentGroupId: item.groupId,
      availableGroups: groupStore.groups.map(g => ({ id: g.id, name: g.name }))
    });
    
    const group = groupStore.groups.find(g => g.id === item.groupId);
    const groupName = group?.name || '일반';
    
    console.log('[HomeScreen] 그룹 찾기 결과:', { groupName, foundGroup: !!group });
    
    return (
      <ContentItem
        item={item}
        currentUserId={authStore.user?.id}
        remainingLikes={likeStore.getRemainingFreeLikes()}
        onLikeToggle={handleLikeToggle}
        onEdit={handleEditContent}
        onDelete={handleDeleteContent}
        groupName={groupName}
      />
    );
  };

  /**
   * 빈 상태 렌더링
   * @returns {JSX.Element} 빈 상태 UI
   * @description 콘텐츠가 없을 때 표시되는 UI
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateEmoji}>📱</Text>
      <Text style={[styles.emptyStateTitle, { color: colors.TEXT.PRIMARY }]}>{t('home:empty.title')}</Text>
      <Text style={[styles.emptyStateSubtitle, { color: colors.TEXT.SECONDARY }]}>
        {t('home:empty.subtitle')}
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
        <ActivityIndicator size="small" color={colors.PRIMARY} />
        <Text style={[styles.loadingText, { color: colors.TEXT.PRIMARY }]}>{t('home:loading.moreContent')}</Text>
      </View>
    );
  };

  if (isLoading && contents.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text style={[styles.loadingText, { color: colors.TEXT.PRIMARY }]}>{t('home:loading.content')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
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
            colors={[colors.PRIMARY]}
            tintColor={colors.PRIMARY}
            backgroundColor={colors.SURFACE}
          />
        }
        onEndReached={loadMoreContents}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={contents.length === 0 ? styles.emptyContainer : undefined}
      />
      
      {/* Story Viewer Modal */}
      <StoryFullViewer
        storyUsers={stories}
        currentUserIndex={selectedStoryIndex}
        currentUserId={authStore.user?.id || 'current_user'}
        visible={showStoryViewer}
        onClose={() => setShowStoryViewer(false)}
        onRefresh={loadStories}
      />
      
      {/* Floating Action Button - 게시물 작성 */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.PRIMARY, shadowColor: colors.SHADOW }]}
        onPress={() => navigation.navigate('CreateContent' as never)}
        activeOpacity={0.8}
        accessibilityLabel="게시물 작성"
        accessibilityHint="새로운 게시물을 작성할 수 있는 화면으로 이동합니다"
        accessibilityRole="button"
      >
        <Icon name={ACTION_ICONS.CREATE} color={colors.TEXT.WHITE} size={28} />
      </TouchableOpacity>
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
  loadingText: {
    marginTop: SPACING.MD,
    fontSize: FONT_SIZES.MD,
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
    marginBottom: SPACING.MD,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationButtonsContainer: {
    flexDirection: 'row',
    gap: SPACING.SM,
    marginTop: SPACING.MD,
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: SPACING.MD,
    borderWidth: 1,
  },
  locationButtonText: {
    flex: 1,
    fontSize: FONT_SIZES.SM,
    fontWeight: '500',
    marginLeft: SPACING.XS,
  },
  statsText: {
    fontSize: FONT_SIZES.SM,
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
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: FONT_SIZES.MD,
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
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});