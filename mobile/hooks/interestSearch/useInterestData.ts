/**
 * 관심상대 데이터 관리 훅
 */
import { useState, useCallback, useEffect } from 'react';
import { useInterestStore } from '@/store/slices/interestSlice';
import { secureInterestService } from '@/services/secureInterestService';
import { InterestType } from '@/types/interest';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LocalCard {
  id: string;
  type: InterestType;
  actualValue?: string;
  displayValue?: string;
  status: string;
  deviceInfo: string;
  registeredAt: string;
  expiresAt?: string;
}

export const useInterestData = (selectedTab: 'interest' | 'friend') => {
  const {
    searches,
    matches,
    loading,
    fetchSearches,
    fetchMatches,
    deleteSearch,
  } = useInterestStore();

  const [refreshing, setRefreshing] = useState(false);
  const [localMergedSearches, setLocalMergedSearches] = useState<any[]>([]);
  const [serverConnectionError, setServerConnectionError] = useState(false);

  // 로컬과 서버 데이터가 병합된 searches 사용 - 배열 검증 추가
  const allSearches = localMergedSearches.length > 0 ? localMergedSearches : (Array.isArray(searches) ? searches : []);

  // 탭에 따라 필터링된 데이터 - 배열 체크 추가
  const filteredSearches = Array.isArray(allSearches) ? allSearches.filter(search => {
    const relationshipIntent = search.metadata?.relationshipIntent?.toLowerCase() || 'romantic';
    return relationshipIntent === (selectedTab === 'interest' ? 'romantic' : 'friend');
  }) : [];

  const filteredMatches = Array.isArray(matches) ? matches.filter(match => {
    const relationshipIntent = match.metadata?.relationshipIntent?.toLowerCase();
    return relationshipIntent === (selectedTab === 'interest' ? 'romantic' : 'friend');
  }) : [];

  const loadData = useCallback(async (forceRefresh = true) => {
    try {
      // 강제 새로고침 시 상태 초기화
      if (forceRefresh) {
        setLocalMergedSearches([]);
        setServerConnectionError(false);
      }

      // 1. 서버 데이터 먼저 로드
      const results = await Promise.allSettled([
        fetchSearches(),
        fetchMatches(),
      ]);
      
      // 모든 요청이 실패했는지 확인
      const allFailed = results.every(result => result.status === 'rejected');
      if (allFailed) {
        setServerConnectionError(true);
        return;
      }
      
      // 2. 서버 데이터 가져오기
      const serverSearches = useInterestStore.getState().searches;
      console.log('[useInterestData] Server searches:', serverSearches.length);
      
      // 3. 로컬에 저장된 보안 카드 로드
      const localCards = await secureInterestService.getMyInterestCards();
      console.log('[useInterestData] Local secure cards:', localCards.length);
      
      // 4. 서버 검색과 로컬 데이터 병합
      const mergedSearches = serverSearches.map(serverSearch => {
        // 로컬 카드와 매칭 (ID 또는 타입+값으로)
        const localCard = localCards.find((card: LocalCard) => 
          card.id === serverSearch.id || 
          (card.type === serverSearch.type && card.status === 'local')
        );
        
        if (localCard && localCard.deviceInfo === 'current') {
          // 현재 기기에서 등록한 카드 - 상세 정보 표시 가능
          return {
            ...serverSearch,
            displayValue: localCard.actualValue || localCard.displayValue || serverSearch.value,
            hasLocalData: true,
            deviceInfo: 'current',
            isSecure: true,
            metadata: {
              ...serverSearch.metadata,
              hasDetails: true,
              localData: {
                actualValue: localCard.actualValue,
                displayValue: localCard.displayValue,
                registeredAt: localCard.registeredAt,
              }
            }
          };
        } else {
          // 다른 기기에서 등록했거나 로컬 정보가 없는 경우
          return {
            ...serverSearch,
            displayValue: null,
            value: serverSearch.value,
            hasLocalData: false,
            deviceInfo: 'other',
            isSecure: true,
            metadata: {
              ...serverSearch.metadata,
              hasDetails: false,
            }
          };
        }
      });
      
      // 5. 로컬에만 있는 카드 추가 (아직 서버에 동기화되지 않은 경우)
      const processedTypes = new Set(mergedSearches.map(s => s.type));
      const localOnlyCards = localCards.filter((card: LocalCard) => 
        !processedTypes.has(card.type) && card.deviceInfo === 'current'
      );
      
      const localOnlySearches = localOnlyCards.map((card: LocalCard) => ({
        id: card.id,
        type: card.type,
        value: card.actualValue || card.displayValue,
        displayValue: card.actualValue || card.displayValue,
        status: card.status === 'matched' ? 'MATCHED' : 'ACTIVE',
        hasLocalData: true,
        deviceInfo: 'current',
        isSecure: true,
        metadata: {
          relationshipIntent: selectedTab === 'interest' ? 'romantic' : 'friend',
          hasDetails: true,
          localOnly: true,
          localData: {
            actualValue: card.actualValue,
            displayValue: card.displayValue,
            registeredAt: card.registeredAt,
          }
        },
        createdAt: card.registeredAt,
        expiresAt: card.expiresAt,
      }));
      
      // 6. 최종 병합 - type 기준으로 중복 제거
      const allSearchesMap = new Map();
      
      [...mergedSearches, ...localOnlySearches].forEach(search => {
        if (!allSearchesMap.has(search.type) || 
            (search.hasLocalData && !allSearchesMap.get(search.type).hasLocalData)) {
          allSearchesMap.set(search.type, search);
        }
      });
      
      const allMergedSearches = Array.from(allSearchesMap.values());
      setLocalMergedSearches(allMergedSearches);
      
      console.log('[useInterestData] Final merged data:', {
        serverCount: serverSearches.length,
        localCount: localCards.length,
        localOnlyCount: localOnlyCards.length,
        totalMerged: allMergedSearches.length,
      });
    } catch (error) {
      console.error('[useInterestData] loadData error:', error);
    }
  }, [selectedTab, fetchSearches, fetchMatches]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleDeleteSearch = useCallback(async (searchId: string) => {
    try {
      // 서버 검색인지 로컬 검색인지 확인
      const isServerSearch = searches.some(s => s.id === searchId);
      
      if (isServerSearch) {
        // 서버 API 호출하여 삭제
        await deleteSearch(searchId);
        await fetchSearches();
      } else {
        // 로컬 검색 삭제
        const storedCards = await AsyncStorage.getItem('interest-secure-cards');
        if (storedCards) {
          const cards = JSON.parse(storedCards);
          const updatedCards = cards.filter((card: any) => card.id !== searchId);
          await AsyncStorage.setItem('interest-secure-cards', JSON.stringify(updatedCards));
        }
      }
      
      // 데이터 새로고침
      await loadData(true);
      return true;
    } catch (error) {
      console.error('[useInterestData] Delete error:', error);
      return false;
    }
  }, [searches, deleteSearch, fetchSearches, loadData]);

  // 디버깅 정보
  useEffect(() => {
    console.log('[useInterestData] Data state:', {
      localMergedSearchesCount: localMergedSearches.length,
      searchesCount: searches.length,
      allSearchesCount: allSearches.length,
      filteredCount: filteredSearches.length,
    });
  }, [localMergedSearches, searches, allSearches, filteredSearches]);

  return {
    loading,
    refreshing,
    serverConnectionError,
    filteredSearches,
    filteredMatches,
    matches,
    loadData,
    handleRefresh,
    handleDeleteSearch,
  };
};