/**
 * 그룹 데이터 관리 훅
 */
import { useState, useCallback } from 'react';
import { Group } from '@/types';
import { groupApi } from '@/services/api/groupApi';

export const useGroupData = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [serverConnectionError, setServerConnectionError] = useState(false);

  /**
   * 최근 그룹만 필터링
   * @description 개발 환경: 30일 이내, 프로덕션: 3일 이내
   */
  const filterRecentGroups = useCallback((groups: Group[]): Group[] => {
    const FILTER_DAYS = __DEV__ ? 30 : 3;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - FILTER_DAYS);
    cutoffDate.setHours(0, 0, 0, 0);

    return groups.filter(group => {
      const groupDate = new Date(group.createdAt);
      return groupDate >= cutoffDate;
    });
  }, []);

  /**
   * 테스트 데이터 생성
   */
  const generateTestGroups = (page: number): Group[] => {
    const now = new Date();
    return [
      {
        id: page === 1 ? 'test-group-1' : `test-group-${page}-1`,
        name: `서강대학교 IT학과 (Page ${page})`,
        description: '서강대학교 IT학과 학생들의 모임입니다. 코딩, 공모전, 취업 정보를 공유합니다.',
        type: 'OFFICIAL' as any,
        memberCount: 45 + page,
        maleCount: 23 + page,
        femaleCount: 22,
        isMatchingActive: true,
        creatorId: 'user-creator',
        createdAt: new Date(now.getTime() - (page - 1) * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - (page - 1) * 60 * 60 * 1000),
        location: {
          address: '서울 마포구 서강대로',
          latitude: 37.5503,
          longitude: 126.9413
        }
      },
      {
        id: `test-group-${page}-2`,
        name: `홍대 경영학과 모임 (Page ${page})`,
        description: '홍대 경영학과 학생들이 모여 스터디, 네트워킹, 취업 준비를 함께합니다.',
        type: 'OFFICIAL' as any,
        memberCount: 38 + page,
        maleCount: 20 + page,
        femaleCount: 18,
        isMatchingActive: true,
        creatorId: 'user-creator2',
        createdAt: new Date(now.getTime() - (page - 1) * 60 * 60 * 1000 - 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - (page - 1) * 60 * 60 * 1000 - 60 * 60 * 1000),
        location: {
          address: '서울 마포구 와우산로',
          latitude: 37.5502,
          longitude: 126.9225
        }
      },
      {
        id: `test-group-${page}-3`,
        name: `강남 커피 러버즈 (Page ${page})`,
        description: '강남역 근처 커피숍에서 모이는 커피 애호가들의 모임입니다.',
        type: 'CREATED' as any,
        memberCount: 28 + page,
        maleCount: 15 + page,
        femaleCount: 13,
        isMatchingActive: true,
        creatorId: 'user-creator3',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        location: {
          address: '서울 강남구 테헤란로',
          latitude: 37.5013,
          longitude: 127.0377
        }
      }
    ];
  };

  /**
   * 그룹 목록 로드
   */
  const loadGroups = useCallback(async (refresh = false, page = 1) => {
    console.log('[useGroupData] loadGroups called, refresh:', refresh, 'page:', page);
    
    // 너무 빠른 연속 새로고침 방지 (2초 이내)
    if (refresh && lastRefreshTime) {
      const timeSinceLastRefresh = Date.now() - lastRefreshTime.getTime();
      if (timeSinceLastRefresh < 2000) {
        console.log('[useGroupData] 새로고침 제한: 너무 빠른 연속 새로고침');
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
      // API 호출하여 그룹 목록 가져오기
      console.log('[useGroupData] API를 통한 그룹 목록 로드 시작');
      const loadedGroups = await groupApi.getGroups({ page, limit: 10 });
      console.log('[useGroupData] API에서 로드된 그룹 수:', loadedGroups.length);
      
      // API 응답이 없거나 에러인 경우 테스트 데이터 사용
      let groupsToSet = loadedGroups;
      if (!loadedGroups || loadedGroups.length === 0) {
        groupsToSet = generateTestGroups(page);
        console.log('[useGroupData] 테스트 데이터 사용, 그룹 수:', groupsToSet.length);
      }
      
      // 최근 그룹 필터링 (개발 환경: 30일, 프로덕션: 3일)
      const recentGroups = filterRecentGroups(groupsToSet);
      console.log('[useGroupData] 필터링 전 그룹 수:', groupsToSet.length, '필터링 후:', recentGroups.length);

      // 페이지네이션 처리
      if (page === 1) {
        setGroups(recentGroups);
      } else {
        setGroups(prev => [...prev, ...recentGroups]);
      }

      // 더 이상 데이터가 없으면 hasMoreData를 false로 설정
      if (recentGroups.length < 10) {
        setHasMoreData(false);
      }
      
      setServerConnectionError(false);
      setCurrentPage(page);
      
    } catch (error) {
      console.error('[useGroupData] 그룹 로드 에러:', error);
      setServerConnectionError(true);
      
      // 개발 환경에서는 테스트 데이터 사용
      if (__DEV__) {
        const testGroups = generateTestGroups(page);
        const recentGroups = filterRecentGroups(testGroups);
        
        if (page === 1) {
          setGroups(recentGroups);
        } else {
          setGroups(prev => [...prev, ...recentGroups]);
        }
        setServerConnectionError(false);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [lastRefreshTime, filterRecentGroups]);

  /**
   * 무한 스크롤 처리
   */
  const handleLoadMore = useCallback(() => {
    console.log('[useGroupData] handleLoadMore called:', { hasMoreData, isLoadingMore, currentPage });
    
    if (hasMoreData && !isLoadingMore && !isLoading) {
      loadGroups(false, currentPage + 1);
    }
  }, [hasMoreData, isLoadingMore, isLoading, currentPage, loadGroups]);

  return {
    groups,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMoreData,
    serverConnectionError,
    loadGroups,
    handleLoadMore,
  };
};