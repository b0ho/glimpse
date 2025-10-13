/**
 * 홈 화면 콘텐츠 데이터 관리 훅
 */
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { Content } from '@/types';
import { contentApi } from '@/services/api/contentApi';
import i18n from '@/services/i18n/i18n';
import { useAuthStore } from '@/store/slices/authSlice';

export const useContentData = () => {
  const { token } = useAuthStore();
  const [contents, setContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [serverConnectionError, setServerConnectionError] = useState(false);

  /**
   * 3일 이내 콘텐츠만 필터링
   */
  const filterRecentContents = useCallback((contents: Content[]): Content[] => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);
    
    return contents.filter(content => {
      const contentDate = new Date(content.createdAt);
      return contentDate >= threeDaysAgo;
    });
  }, []);

  /**
   * 테스트 콘텐츠 생성
   */
  const generateTestContents = (page: number): Content[] => {
    const now = new Date();
    return [
      {
        id: `test-${page}-1`,
        userId: 'user1',
        authorId: 'user1',
        authorNickname: i18n.language === 'ko' ? '커피러버' : 'Coffee Lover',
        type: 'POST' as const,
        text: i18n.language === 'ko'
          ? `오늘 날씨가 너무 좋네요! 다들 좋은 하루 되세요 ☀️ (Page ${page})`
          : `The weather is so nice today! Have a great day everyone ☀️ (Page ${page})`,
        mediaUrl: '',
        imageUrls: [],
        likes: 12,
        likeCount: 12,
        comments: 3,
        views: 45,
        isPublic: true,
        isLikedByUser: false,
        groupId: 'group1',
        createdAt: new Date(now.getTime() - (page - 1) * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - (page - 1) * 60 * 60 * 1000),
      },
      {
        id: `test-${page}-2`,
        userId: 'user2',
        authorId: 'user2',
        authorNickname: i18n.language === 'ko' ? '개발자' : 'Developer',
        type: 'POST' as const,
        text: i18n.language === 'ko'
          ? `새로운 프로젝트 시작했습니다! 화이팅 💪 (Page ${page})`
          : `Started a new project! Fighting 💪 (Page ${page})`,
        mediaUrl: '',
        imageUrls: [],
        likes: 8,
        likeCount: 8,
        comments: 2,
        views: 32,
        isPublic: true,
        isLikedByUser: false,
        groupId: 'group2',
        createdAt: new Date(now.getTime() - (page - 1) * 60 * 60 * 1000 - 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - (page - 1) * 60 * 60 * 1000 - 60 * 60 * 1000),
      },
      {
        id: `test-${page}-3`,
        userId: 'user3',
        authorId: 'user3',
        authorNickname: i18n.language === 'ko' ? '운동매니아' : 'Fitness Enthusiast',
        type: 'POST' as const,
        text: i18n.language === 'ko'
          ? `오늘도 헬스장 다녀왔습니다! 운동하면 기분이 좋아져요 🏋️ (Page ${page})`
          : `Went to the gym today! Exercise makes me feel good 🏋️ (Page ${page})`,
        mediaUrl: '',
        imageUrls: [],
        likes: 15,
        likeCount: 15,
        comments: 5,
        views: 67,
        isPublic: true,
        isLikedByUser: true,
        groupId: 'group3',
        createdAt: new Date(now.getTime() - (page - 1) * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - (page - 1) * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
      },
    ];
  };

  /**
   * 콘텐츠 목록 로드
   */
  const loadContents = useCallback(async (refresh = false, page = 1) => {
    console.log('[useContentData] loadContents called, refresh:', refresh, 'page:', page);
    
    // 너무 빠른 연속 새로고침 방지 (2초 이내)
    if (refresh && lastRefreshTime) {
      const timeSinceLastRefresh = Date.now() - lastRefreshTime.getTime();
      if (timeSinceLastRefresh < 2000) {
        console.log('[useContentData] 새로고침 제한: 너무 빠른 연속 새로고침');
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
      if (!token) {
        console.log('[useContentData] Skip API call: no auth token loaded');
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
        setServerConnectionError(false);
        return;
      }
      console.log('[useContentData] Calling API...');
      const apiContents = await contentApi.getContents(undefined, page, 10);
      console.log('[useContentData] API response:', apiContents);
      
      let contentsToSet = apiContents;
      
      // API 응답이 없거나 에러인 경우 테스트 데이터 사용
      if (!apiContents || apiContents.length === 0) {
        contentsToSet = generateTestContents(page);
        console.log('[useContentData] Using test contents for page:', page);
      }
      
      // 3일 이내 콘텐츠만 필터링
      const recentContents = filterRecentContents(contentsToSet);
      console.log('[useContentData] Filtered recent contents:', recentContents.length);
      
      if (refresh || page === 1) {
        setContents(recentContents);
        setCurrentPage(1);
      } else {
        setContents(prevContents => [...prevContents, ...recentContents]);
        setCurrentPage(page);
      }
      
      // 더 이상 로드할 데이터가 있는지 확인
      setHasMoreData(contentsToSet.length >= 10 && recentContents.length > 0);
      setServerConnectionError(false);
      
    } catch (error) {
      console.error('[useContentData] Content load failed:', error);
      
      // API 호출 실패 시 처리
      if (page === 1) {
        // 첫 페이지 로드 실패 시 서버 연결 에러 표시
        setServerConnectionError(true);
        setHasMoreData(false);
        
        // 개발 환경에서만 테스트 데이터 사용 (명시적 플래그 필요)
        if (__DEV__ && process.env.EXPO_PUBLIC_USE_TEST_DATA === 'true') {
          const testContents = generateTestContents(1);
          const recentContents = filterRecentContents(testContents);
          setContents(recentContents);
          setServerConnectionError(false);
          console.log('[useContentData] Using test contents in dev mode');
        }
      } else {
        // 추가 페이지 로드 실패 시
        setHasMoreData(false);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [lastRefreshTime, filterRecentContents, token]);

  /**
   * 추가 콘텐츠 로드 (무한 스크롤)
   */
  const loadMoreContents = useCallback(async () => {
    console.log('[useContentData] loadMoreContents called:', { hasMoreData, isLoading, isLoadingMore, currentPage });
    
    if (!hasMoreData || isLoading || isLoadingMore) {
      console.log('[useContentData] 무한 스크롤 중단:', { hasMoreData, isLoading, isLoadingMore });
      return;
    }

    // 테스트 데이터의 경우 최대 5페이지까지만 로드
    if (currentPage >= 5) {
      setHasMoreData(false);
      return;
    }

    console.log('[useContentData] 무한 스크롤: 다음 페이지 로드 시작', { nextPage: currentPage + 1 });
    await loadContents(false, currentPage + 1);
  }, [hasMoreData, isLoading, isLoadingMore, currentPage, loadContents]);

  return {
    contents,
    setContents,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMoreData,
    serverConnectionError,
    loadContents,
    loadMoreContents,
  };
};