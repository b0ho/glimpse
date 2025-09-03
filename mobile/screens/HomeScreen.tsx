import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
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
import { shadowPresets } from '@/utils/styles/platformStyles';
import { ACTION_ICONS } from '@/utils/icons';
import { SuccessStoryCard } from '@/components/successStory/SuccessStoryCard';
import { SuccessStory } from '@/types/successStory';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServerConnectionError } from '@/components/ServerConnectionError';

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
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [serverConnectionError, setServerConnectionError] = useState(false);
  
  // Story states
  const [stories, setStories] = useState<StoryUser[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  
  // Success Story states
  const [successStories, setSuccessStories] = useState<SuccessStory[]>([]);
  const [celebratedStories, setCelebratedStories] = useState<Set<string>>(new Set());
  
  const navigation = useNavigation() as any;
  const authStore = useAuthStore();
  
  // 웹에서 페이지 타이틀 설정
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = t('home:meta.title');
    }
  }, []);
  const likeStore = useLikeStore();
  const groupStore = useGroupStore();
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation(['navigation']);

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
   * 성공 스토리 목록 로드
   * @returns {Promise<void>}
   * @description 매칭 성공 스토리를 가져오는 함수
   */
  const loadSuccessStories = useCallback(async () => {
    try {
      const storiesStr = await AsyncStorage.getItem('success-stories');
      if (storiesStr) {
        const stories = JSON.parse(storiesStr);
        // 최근 일주일 이내 스토리만 필터링
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const recentStories = stories.filter((story: SuccessStory) => {
          const storyDate = new Date(story.createdAt);
          return storyDate > oneWeekAgo;
        });
        
        setSuccessStories(recentStories);
      }
      
      // 축하한 스토리 목록 로드
      const celebratedStr = await AsyncStorage.getItem('celebrated-stories');
      if (celebratedStr) {
        setCelebratedStories(new Set(JSON.parse(celebratedStr)));
      }
    } catch (error) {
      console.error('[HomeScreen] Failed to load success stories:', error);
    }
  }, []);

  /**
   * 스토리 축하하기
   * @param {string} storyId - 스토리 ID
   * @returns {Promise<void>}
   */
  const handleCelebrate = useCallback(async (storyId: string) => {
    try {
      const newCelebrated = new Set(celebratedStories);
      newCelebrated.add(storyId);
      setCelebratedStories(newCelebrated);
      
      // AsyncStorage에 저장
      await AsyncStorage.setItem('celebrated-stories', JSON.stringify(Array.from(newCelebrated)));
      
      // 스토리 카운트 업데이트
      setSuccessStories(prev => 
        prev.map(story => 
          story.id === storyId 
            ? { ...story, celebrationCount: story.celebrationCount + 1 }
            : story
        )
      );
    } catch (error) {
      console.error('[HomeScreen] Failed to celebrate story:', error);
    }
  }, [celebratedStories]);

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
      
      Alert.alert(t('home:alerts.deleteComplete'), t('home:alerts.deleteSuccess'));
    } catch (error) {
      console.error('Content delete error:', error);
      Alert.alert(t('home:alerts.deleteFailed'), t('home:alerts.deleteError'));
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
   * 3일 이내 콘텐츠만 필터링
   * @param {Content[]} contents - 필터링할 콘텐츠 배열
   * @returns {Content[]} 필터링된 콘텐츠 배열
   */
  const filterRecentContents = useCallback((contents: Content[]): Content[] => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0); // 자정부터 시작
    
    return contents.filter(content => {
      const contentDate = new Date(content.createdAt);
      return contentDate >= threeDaysAgo;
    });
  }, []);

  /**
   * 콘텐츠 목록 로드
   * @param {boolean} refresh - 새로고침 여부
   * @returns {Promise<void>}
   * @description 피드에 표시할 콘텐츠 목록을 가져오는 함수
   */
  const loadContents = useCallback(async (refresh = false, page = 1) => {
    console.log('[HomeScreen] loadContents called, refresh:', refresh, 'page:', page);
    
    // 인스타그램 스타일: 너무 빠른 연속 새로고침 방지 (2초 이내)
    if (refresh && lastRefreshTime) {
      const timeSinceLastRefresh = Date.now() - lastRefreshTime.getTime();
      if (timeSinceLastRefresh < 2000) {
        console.log('[HomeScreen] 새로고침 제한: 너무 빠른 연속 새로고침');
        return;
      }
    }
    
    if (refresh) {
      setIsRefreshing(true);
      setLastRefreshTime(new Date());
      setCurrentPage(1);
    } else if (page > 1) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      // 실제 API 호출로 콘텐츠 가져오기
      console.log('[HomeScreen] Calling API...');
      const apiContents = await contentApi.getContents(undefined, page, 10);
      console.log('[HomeScreen] API response:', apiContents);
      
      // API 응답이 없거나 에러인 경우 테스트 데이터 사용
      if (!apiContents || apiContents.length === 0) {
        // 현재 날짜 기준으로 테스트 데이터 생성 (3일 이내)
        const now = new Date();
        const testContents: Content[] = [
          {
            id: `test-${page}-1`,
            userId: 'user1',
            authorId: 'user1',
            authorNickname: i18n.language === 'ko' ? '커피러버' : 'Coffee Lover',
            type: 'text',
            text: i18n.language === 'ko' 
              ? `오늘 날씨가 너무 좋네요! 다들 좋은 하루 되세요 ☀️ (Page ${page})` 
              : `The weather is so nice today! Have a great day everyone ☀️ (Page ${page})`,
            imageUrls: [],
            likes: 12,
            likeCount: 12,
            views: 45,
            isPublic: true,
            isLikedByUser: false,
            groupId: 'group1',
            createdAt: new Date(now.getTime() - (page - 1) * 60 * 60 * 1000).toISOString(), // 시간 차이 두기
            updatedAt: new Date(now.getTime() - (page - 1) * 60 * 60 * 1000).toISOString(),
          },
          {
            id: `test-${page}-2`,
            userId: 'user2',
            authorId: 'user2',
            authorNickname: i18n.language === 'ko' ? '개발자' : 'Developer',
            type: 'text',
            text: i18n.language === 'ko'
              ? `새로운 프로젝트 시작했습니다! 화이팅 💪 (Page ${page})`
              : `Started a new project! Fighting 💪 (Page ${page})`,
            imageUrls: [],
            likes: 8,
            likeCount: 8,
            views: 32,
            isPublic: true,
            isLikedByUser: false,
            groupId: 'group2',
            createdAt: new Date(now.getTime() - (page - 1) * 60 * 60 * 1000 - 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - (page - 1) * 60 * 60 * 1000 - 60 * 60 * 1000).toISOString(),
          },
          {
            id: `test-${page}-3`,
            userId: 'user3',
            authorId: 'user3',
            authorNickname: i18n.language === 'ko' ? '운동매니아' : 'Fitness Enthusiast',
            type: 'text',
            text: i18n.language === 'ko'
              ? `오늘도 헬스장 다녀왔습니다! 운동하면 기분이 좋아져요 🏋️ (Page ${page})`
              : `Went to the gym today! Exercise makes me feel good 🏋️ (Page ${page})`,
            imageUrls: [],
            likes: 15,
            likeCount: 15,
            views: 67,
            isPublic: true,
            isLikedByUser: true,
            groupId: 'group3',
            createdAt: new Date(now.getTime() - (page - 1) * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - (page - 1) * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(),
          },
        ];
        
        console.log('[HomeScreen] Using test contents for page:', page);
        
        // 3일 이내 콘텐츠만 필터링
        const recentTestContents = filterRecentContents(testContents);
        
        if (refresh || page === 1) {
          setContents(recentTestContents);
          setCurrentPage(1);
        } else {
          setContents(prevContents => [...prevContents, ...recentTestContents]);
          setCurrentPage(page);
        }
        
        // 테스트 데이터의 경우 3페이지까지만 로드
        setHasMoreData(page < 3 && recentTestContents.length > 0);
        return;
      }
      
      console.log('[HomeScreen] Setting real contents:', apiContents.length);
      
      // 3일 이내 콘텐츠만 필터링
      const recentContents = filterRecentContents(apiContents);
      console.log('[HomeScreen] Filtered recent contents:', recentContents.length, '/ original:', apiContents.length);
      
      if (refresh || page === 1) {
        setContents(recentContents);
        setCurrentPage(1);
      } else {
        setContents(prevContents => [...prevContents, ...recentContents]);
        setCurrentPage(page);
      }
      
      // 더 이상 로드할 데이터가 있는지 확인
      // API에서 받은 데이터가 10개 미만이거나, 필터링 후 데이터가 없으면 끝
      setHasMoreData(apiContents.length >= 10 && recentContents.length > 0);
      
      // 새로고침 완료 시 부드러운 피드백 제공
      if (refresh) {
        console.log('[HomeScreen] 새로고침 완료: 최신 데이터 로드됨');
      }
    } catch (error) {
      console.error('[HomeScreen] Content load failed:', error);
      
      // 서버 연결 실패 처리
      setServerConnectionError(true);
      setHasMoreData(false);
      setContents([]); // 빈 컨텐츠로 설정
      
      // 첫 페이지 로드 실패 시에만 Alert 표시
      if (page === 1 && !refresh) {
        Alert.alert(
          '서버 연결 실패',
          '서버에 연결할 수 없습니다. 인터넷 연결을 확인하고 다시 시도해주세요.',
          [
            { text: '확인', style: 'cancel' },
            { text: '다시 시도', onPress: () => {
              setServerConnectionError(false);
              loadContents(true);
            }}
          ]
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [t, lastRefreshTime, filterRecentContents]);

  /**
   * Pull-to-refresh 핸들러
   * @returns {Promise<void>}
   * @description 인스타그램 스타일의 pull-to-refresh 동작을 처리하는 함수
   */
  const handlePullToRefresh = useCallback(async () => {
    console.log('[HomeScreen] Pull-to-refresh triggered - 인스타그램 스타일 새로고침');
    await Promise.all([
      loadContents(true),
      loadStories(),
      loadSuccessStories()
    ]);
  }, [loadContents, loadStories, loadSuccessStories]);

  /**
   * 추가 콘텐츠 로드 (무한 스크롤)
   * @returns {Promise<void>}
   * @description 스크롤 끝에 도달했을 때 추가 콘텐츠를 로드하는 함수
   */
  const loadMoreContents = useCallback(async () => {
    console.log('[HomeScreen] loadMoreContents called:', { hasMoreData, isLoading, isLoadingMore, currentPage });
    
    if (!hasMoreData || isLoading || isLoadingMore) {
      console.log('[HomeScreen] 무한 스크롤 중단:', { hasMoreData, isLoading, isLoadingMore });
      return;
    }

    console.log('[HomeScreen] 무한 스크롤: 다음 페이지 로드 시작', { nextPage: currentPage + 1 });
    await loadContents(false, currentPage + 1);
  }, [hasMoreData, isLoading, isLoadingMore, currentPage, loadContents]);

  useEffect(() => {
    // 컴포넌트 마운트 시 콘텐츠 로드
    loadContents();
    
    // 스토리 로드
    loadStories();
    // 성공 스토리 로드
    loadSuccessStories();
  }, []); // 빈 배열로 변경하여 마운트 시 한 번만 실행

  // 화면에 포커스될 때마다 콘텐츠 새로고침 (스토리 작성 후 등)
  useFocusEffect(
    useCallback(() => {
      console.log('[HomeScreen] 화면 포커스 - 콘텐츠 및 스토리 새로고침');
      // 초기 로딩이 아닌 경우에만 새로고침
      if (!isLoading && contents.length > 0) {
        loadContents(true);
        loadStories();
        loadSuccessStories();
      }
      return () => {
        // cleanup
      };
    }, []) // 빈 배열로 변경
  );

  /**
   * 성공 스토리 섹션 렌더링
   * @returns {JSX.Element | null} 성공 스토리 섹션 UI
   */
  const renderSuccessStories = () => {
    if (successStories.length === 0) return null;
    
    return (
      <View style={[styles.successStoriesSection, { backgroundColor: colors.SURFACE }]}>
        <View style={styles.successStoriesHeader}>
          <View style={styles.successStoriesTitle}>
            <Text style={styles.celebrationEmoji}>💑</Text>
            <Text style={[styles.successStoriesTitleText, { color: colors.TEXT.PRIMARY }]}>
              {t('home:successStories.title')}
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('InterestSearch' as never)}>
            <Text style={[styles.viewAllText, { color: colors.PRIMARY }]}>
              {t('home:successStories.viewAll')}
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.successStoriesScroll}
        >
          {successStories.map((story) => (
            <View key={story.id} style={styles.successStoryWrapper}>
              <SuccessStoryCard
                story={story}
                onCelebrate={handleCelebrate}
                hasCelebrated={celebratedStories.has(story.id)}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

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
          <Text style={[styles.locationButtonText, { color: colors.TEXT.PRIMARY }]}>{t('navigation:screens.nearbyGroups')}</Text>
          <Icon name="chevron-forward" size={16} color={colors.TEXT.SECONDARY} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.locationButton, { backgroundColor: colors.SURFACE, borderColor: colors.PRIMARY + '20' }]}
          onPress={() => navigation.navigate('NearbyUsers' as never)}
        >
          <Icon name="people-outline" size={20} color={colors.PRIMARY} />
          <Text style={[styles.locationButtonText, { color: colors.TEXT.PRIMARY }]}>{t('navigation:screens.nearbyUsers')}</Text>
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
   * @description 무한 스크롤 로딩 표시 및 마지막 안내
   */
  const renderFooter = () => {
    console.log('[HomeScreen] renderFooter:', { hasMoreData, isLoadingMore, contentsLength: contents.length });
    
    if (isLoadingMore) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={colors.PRIMARY} />
          <Text style={[styles.loadingText, { color: colors.TEXT.PRIMARY }]}>
            {t('home:loading.moreContent')}
          </Text>
        </View>
      );
    }
    
    if (!hasMoreData && contents.length > 0) {
      return (
        <View style={styles.endReachedFooter}>
          <Text style={[styles.endReachedText, { color: colors.TEXT.SECONDARY }]}>
            {t('home:loading.endReached')}
          </Text>
          <Text style={[styles.endReachedSubtext, { color: colors.TEXT.SECONDARY }]}>
            {t('home:loading.noMoreContent')}
          </Text>
        </View>
      );
    }
    
    return null;
  };

  // 서버 연결 에러 시 에러 화면 표시
  if (serverConnectionError) {
    return (
      <ServerConnectionError 
        onRetry={loadContents}
        message="홈 피드를 불러올 수 없습니다"
      />
    );
  }

  if (isLoading && contents.length === 0) {
    return (
      <SafeAreaView 
        style={[styles.container, { backgroundColor: colors.BACKGROUND }]} 
        edges={Platform.OS === 'android' ? ['top'] : ['top', 'bottom']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text style={[styles.loadingText, { color: colors.TEXT.PRIMARY }]}>{t('home:loading.content')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.BACKGROUND }]} 
      edges={Platform.OS === 'android' ? ['top'] : ['top', 'bottom']}
    >
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
            {/* 성공 스토리 섹션 */}
            {renderSuccessStories()}
          </>
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handlePullToRefresh}
            colors={[colors.PRIMARY]}
            tintColor={colors.PRIMARY}
            backgroundColor={colors.SURFACE}
            title={t('home:refreshing')}
            titleColor={colors.TEXT.SECONDARY}
          />
        }
        onEndReached={loadMoreContents}
        onEndReachedThreshold={0.3}
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
        style={[styles.fab, { backgroundColor: colors.PRIMARY }]}
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
  endReachedFooter: {
    paddingVertical: SPACING.XL,
    alignItems: 'center',
    marginTop: SPACING.MD,
  },
  endReachedText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.XS,
  },
  endReachedSubtext: {
    fontSize: FONT_SIZES.SM,
    textAlign: 'center',
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
    ...shadowPresets.fab,
  },
  personaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: 20,
    marginTop: SPACING.SM,
    gap: SPACING.XS,
  },
  personaButtonText: {
    color: 'white',
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  // 성공 스토리 스타일
  successStoriesSection: {
    marginTop: SPACING.MD,
    paddingTop: SPACING.LG,
    paddingBottom: SPACING.SM,
  },
  successStoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    marginBottom: SPACING.MD,
  },
  successStoriesTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  celebrationEmoji: {
    fontSize: 20,
    marginRight: SPACING.XS,
  },
  successStoriesTitleText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  successStoriesScroll: {
    paddingHorizontal: SPACING.SM,
  },
  successStoryWrapper: {
    width: 320,
    marginHorizontal: SPACING.XS,
  },
});