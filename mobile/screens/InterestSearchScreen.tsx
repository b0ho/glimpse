import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useInterestStore } from '@/store/slices/interestSlice';
import { secureInterestService } from '@/services/secureInterestService';
import { InterestCard } from '@/components/interest/InterestCard';
import { InterestEmptyState } from '@/components/interest/InterestEmptyState';
import { useAuthStore } from '@/store/slices/authSlice';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CreateStoryModal } from '@/components/successStory/CreateStoryModal';
import { ServerConnectionError } from '@/components/ServerConnectionError';
import { SubscriptionTier, SUBSCRIPTION_FEATURES } from '@/types/subscription';
import { InterestType } from '@/types/interest';
import Toast from 'react-native-toast-message';

/**
 * 관심상대 찾기 메인 화면
 */
export const InterestSearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { t } = useAndroidSafeTranslation('interest');
  const { user, getSubscriptionTier, getSubscriptionFeatures } = useAuthStore();
  const {
    searches,
    matches,
    loading,
    fetchSearches,
    fetchMatches,
    deleteSearch,
  } = useInterestStore();

  const [refreshing, setRefreshing] = useState(false);
  const [storyModalVisible, setStoryModalVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<'interest' | 'friend'>('interest');
  const [localMergedSearches, setLocalMergedSearches] = useState<any[]>([]);
  const [serverConnectionError, setServerConnectionError] = useState(false);
  
  const subscriptionTier = getSubscriptionTier();
  const features = getSubscriptionFeatures();

  // 로컬과 서버 데이터가 병합된 searches 사용
  // localMergedSearches가 아직 로드되지 않았으면 searches 사용
  const allSearches = localMergedSearches.length > 0 ? localMergedSearches : searches;

  // 탭에 따라 필터링된 데이터
  const filteredSearches = allSearches.filter(search => {
    const relationshipIntent = search.metadata?.relationshipIntent?.toLowerCase() || 'romantic';
    return relationshipIntent === (selectedTab === 'interest' ? 'romantic' : 'friend');
  });
  
  // 디버깅: 실제 데이터 확인
  useEffect(() => {
    console.log('[InterestSearchScreen] Data state:', {
      localMergedSearchesCount: localMergedSearches.length,
      searchesCount: searches.length,
      allSearchesCount: allSearches.length,
      filteredCount: filteredSearches.length,
    });
  }, [localMergedSearches, searches, allSearches, filteredSearches]);
  
  const filteredMatches = matches.filter(match => {
    const relationshipIntent = match.metadata?.relationshipIntent?.toLowerCase();
    return relationshipIntent === (selectedTab === 'interest' ? 'romantic' : 'friend');
  });

  // 화면이 포커스될 때마다 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      console.log('[InterestSearchScreen] Screen focused - refreshing data');
      loadData();
    }, [])
  );


  const loadData = async (forceRefresh = true) => {
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
      console.log('[InterestSearchScreen] Server searches:', serverSearches.length);
      
      // 3. 로컬에 저장된 보안 카드 로드
      const localCards = await secureInterestService.getMyInterestCards();
      console.log('[InterestSearchScreen] Local secure cards:', localCards.length);
      
      // 4. 서버 검색과 로컬 데이터 병합
      const mergedSearches = serverSearches.map(serverSearch => {
        // 로컬 카드와 매칭 (ID 또는 타입+값으로)
        const localCard = localCards.find(card => 
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
          // 다른 기기에서 등록했거나 로컬 정보가 없는 경우 - 서버 데이터 표시
          return {
            ...serverSearch,
            displayValue: null, // 상세 정보는 표시 불가
            value: serverSearch.value, // 서버에서 받은 마스킹된 값
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
      // type을 기준으로 이미 처리된 항목 확인
      const processedTypes = new Set(mergedSearches.map(s => s.type));
      const localOnlyCards = localCards.filter(card => 
        !processedTypes.has(card.type) && card.deviceInfo === 'current'
      );
      
      const localOnlySearches = localOnlyCards.map(card => ({
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
      
      // 서버 데이터를 먼저 추가 (우선순위가 높음)
      [...mergedSearches, ...localOnlySearches].forEach(search => {
        // type이 같은 경우 로컬 데이터가 있는 것을 우선
        if (!allSearchesMap.has(search.type) || 
            (search.hasLocalData && !allSearchesMap.get(search.type).hasLocalData)) {
          allSearchesMap.set(search.type, search);
        }
      });
      
      const allMergedSearches = Array.from(allSearchesMap.values());
      setLocalMergedSearches(allMergedSearches);
      
      console.log('[InterestSearchScreen] Final merged data:', {
        serverCount: serverSearches.length,
        localCount: localCards.length,
        localOnlyCount: localOnlyCards.length,
        totalMerged: allMergedSearches.length,
        withDetails: allMergedSearches.filter(s => s.hasLocalData).length,
        withoutDetails: allMergedSearches.filter(s => !s.hasLocalData).length,
      });
    } catch (error) {
      console.error('[InterestSearchScreen] loadData error:', error);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleDeleteSearch = async (searchId: string) => {
    // 삭제 확인 다이얼로그
    const showDeleteConfirm = (): Promise<boolean> => {
      return new Promise((resolve) => {
        if (Platform.OS === 'web') {
          const confirmed = window.confirm('이 검색을 삭제하시겠습니까?\n\n삭제 후 7일간 동일한 유형을 다시 등록할 수 없습니다.');
          resolve(confirmed);
        } else {
          Alert.alert(
            '검색 삭제',
            '이 검색을 삭제하시겠습니까?\n\n삭제 후 7일간 동일한 유형을 다시 등록할 수 없습니다.',
            [
              { text: '취소', style: 'cancel', onPress: () => resolve(false) },
              { text: '삭제', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        }
      });
    };

    const confirmed = await showDeleteConfirm();
    
    if (confirmed) {
      try {
        // 서버 검색인지 로컬 검색인지 확인
        const isServerSearch = searches.some(s => s.id === searchId);
        
        if (isServerSearch) {
          // 서버 API 호출하여 삭제 (store의 deleteSearch 사용)
          await deleteSearch(searchId);
          
          // 서버 데이터 새로고침
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
        
        Toast.show({
          type: 'success',
          text1: '삭제 완료',
          text2: '검색이 삭제되었습니다',
          position: 'bottom',
          visibilityTime: 3000,
        });
      } catch (error) {
        console.error('[InterestSearchScreen] Delete error:', error);
        Toast.show({
          type: 'error',
          text1: '삭제 실패',
          text2: '삭제 중 오류가 발생했습니다',
          position: 'bottom',
          visibilityTime: 3000,
        });
      }
    }
  };

  const handleAddInterest = (registrationType: 'MY_INFO' | 'LOOKING_FOR' = 'LOOKING_FOR') => {
    // TESTING: Completely bypass ALL subscription checks for comprehensive testing
    console.log('[InterestSearchScreen] Subscription check COMPLETELY BYPASSED for testing all 12 types');
    
    // Skip all checks and go directly to navigation
    navigation.navigate('AddInterest', { 
      relationshipType: selectedTab === 'interest' ? 'romantic' : 'friend',
      registrationType
    });
    return;
    
    /* Original subscription check code - temporarily disabled for testing
    // BASIC (무료) 계정 제한 확인
    if (subscriptionTier === SubscriptionTier.BASIC) {
      // 현재 탭의 관심사만 카운트 (romantic 또는 friend)
      // 전체가 아닌 현재 컨텍스트의 검색만 제한
      const currentTabSearches = allSearches.filter(search => {
        const intent = search.metadata?.relationshipIntent?.toLowerCase();
        return intent === (selectedTab === 'interest' ? 'romantic' : 'friend');
      });
      
      const activeSearchCount = currentTabSearches.length;
      
      console.log('[InterestSearchScreen] Subscription check:', {
        tier: subscriptionTier,
        activeSearchCount,
        currentTab: selectedTab,
        currentTabSearches: currentTabSearches.map(s => ({ 
          type: s.type, 
          value: s.value || s.displayValue,
          intent: s.metadata?.relationshipIntent 
        })),
        totalSearches: allSearches.length,
      });
      
      // 현재 탭 기준으로 체크
      if (activeSearchCount >= 3) {
        Toast.show({
          type: 'info',
          text1: '구독 제한',
          text2: '무료 사용자는 최대 3개까지 등록 가능합니다',
          position: 'bottom',
          visibilityTime: 4000,
        });
        // 프리미엄 화면으로 자동 이동
        setTimeout(() => {
          navigation.navigate('Premium' as never);
        }, 1000);
        return;
      }
    }
    
    // ADVANCED 계정 제한 확인 (유형별 3개)
    if (subscriptionTier === SubscriptionTier.ADVANCED) {
      // 각 유형별 개수 확인
      const typeCounts: Record<string, number> = {};
      allSearches.forEach(search => {
        typeCounts[search.type] = (typeCounts[search.type] || 0) + 1;
      });
      
      // 모든 유형이 3개에 도달했는지 확인
      const allTypesFull = Object.values(typeCounts).every(count => count >= 3);
      
      if (allTypesFull && Object.keys(typeCounts).length >= 3) {
        Toast.show({
          type: 'info',
          text1: '구독 제한',
          text2: '베이직 사용자는 유형별 최대 3개까지 등록 가능합니다',
          position: 'bottom',
          visibilityTime: 4000,
        });
        // 프리미엄 화면으로 자동 이동
        setTimeout(() => {
          navigation.navigate('Premium' as never);
        }, 1000);
        return;
      }
    }
    */
    
    navigation.navigate('AddInterest', { 
      relationshipType: selectedTab === 'interest' ? 'romantic' : 'friend',
      registrationType
    });
  };

  const handleReportMismatch = async (item: any) => {
    const nickname = item.matchedUser?.nickname || t('search.anonymous');
    
    // Toast로 미스매치 신고 확인
    const showMismatchConfirmToast = (): Promise<boolean> => {
      return new Promise((resolve) => {
        if (Platform.OS === 'web') {
          const confirmed = window.confirm(`미스매치 신고\n\n${nickname}님과의 매칭이 잘못되었다고 신고하시겠습니까?`);
          resolve(confirmed);
        } else {
          Alert.alert(
            '미스매치 신고',
            `${nickname}님과의 매칭이 잘못되었다고 신고하시겠습니까?`,
            [
              { text: '취소', style: 'cancel', onPress: () => resolve(false) },
              { text: '신고', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        }
      });
    };

    const confirmed = await showMismatchConfirmToast();
    
    if (confirmed) {
      try {
        // API 호출 또는 로컬 처리
        const storedMatches = await AsyncStorage.getItem('interest-matches');
        if (storedMatches) {
          const matches = JSON.parse(storedMatches);
          const updatedMatches = matches.map((m: any) => 
            m.id === item.id 
              ? { ...m, status: 'MISMATCH', mismatchedAt: new Date().toISOString() }
              : m
          );
          await AsyncStorage.setItem('interest-matches', JSON.stringify(updatedMatches));
          await fetchMatches(); // 목록 새로고침
          
          Toast.show({
            type: 'success',
            text1: '신고 완료',
            text2: '미스매치가 신고되었습니다',
            position: 'bottom',
            visibilityTime: 3000,
          });
        }
      } catch (error) {
        console.error('Failed to report mismatch:', error);
        Toast.show({
          type: 'error',
          text1: '신고 실패',
          text2: '신고 처리 중 오류가 발생했습니다',
          position: 'bottom',
          visibilityTime: 3000,
        });
      }
    }
  };

  const handleChatPress = async (item: any) => {
    // 채팅방 정보를 채팅 목록에 추가
    const newChatRoom = {
      id: `interest-${item.searchId || item.id}`,
      matchId: item.matchedUserId || item.matchedUser?.id,
      otherUserNickname: item.matchedUser?.nickname || t('search.anonymous'),
      lastMessage: '채팅을 시작해보세요!',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      isOnline: false,
    };
    
    // AsyncStorage에 채팅방 정보 저장
    try {
      const existingRoomsStr = await AsyncStorage.getItem('chat-rooms');
      const existingRooms = existingRoomsStr ? JSON.parse(existingRoomsStr) : [];
      
      // 중복 체크
      const existingRoom = existingRooms.find((room: any) => room.id === newChatRoom.id);
      if (!existingRoom) {
        existingRooms.push(newChatRoom);
        await AsyncStorage.setItem('chat-rooms', JSON.stringify(existingRooms));
      }
      
      // 채팅 화면으로 이동
      navigation.navigate('Chat', {
        roomId: newChatRoom.id,
        matchId: newChatRoom.matchId,
        otherUserNickname: newChatRoom.otherUserNickname,
      });
    } catch (error) {
      console.error('Failed to save chat room:', error);
    }
  };

  const handleShareStory = (match: any) => {
    setSelectedMatch(match);
    setStoryModalVisible(true);
  };

  const getSearchInfo = (match: any) => {
    if (match.matchType && match.matchValue) {
      return {
        type: getTypeLabel(match.matchType),
        value: match.matchValue,
      };
    }
    return null;
  };

  const getTypeLabel = (type: InterestType): string => {
    const labels: Record<InterestType, string> = {
      [InterestType.PHONE]: '전화번호',
      [InterestType.EMAIL]: '이메일',
      [InterestType.SOCIAL_ID]: '소셜 계정',
      [InterestType.NAME]: '이름',
      [InterestType.GROUP]: '특정 그룹',
      [InterestType.LOCATION]: '장소',
      [InterestType.NICKNAME]: '닉네임',
      [InterestType.COMPANY]: '회사',
      [InterestType.SCHOOL]: '학교',
      [InterestType.HOBBY]: '취미/관심사',
      [InterestType.PLATFORM]: '플랫폼',
      [InterestType.GAME_ID]: '게임 아이디',
    };
    return labels[type] || '기타';
  };

  const handleSaveSuccessStory = async (story: string, tags: string[], isAnonymous: boolean) => {
    try {
      const existingStoriesStr = await AsyncStorage.getItem('success-stories');
      const existingStories = existingStoriesStr ? JSON.parse(existingStoriesStr) : [];
      
      const newStory = {
        id: `story-${Date.now()}`,
        userId: user?.id,
        partnerId: selectedMatch.matchedUserId || selectedMatch.matchedUser?.id,
        userNickname: user?.nickname || '나',
        partnerNickname: selectedMatch.matchedUser?.nickname || '익명',
        story,
        tags,
        celebrationCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAnonymous,
        matchType: getSearchInfo(selectedMatch)?.type,
      };
      
      existingStories.unshift(newStory);
      await AsyncStorage.setItem('success-stories', JSON.stringify(existingStories));
      
      setStoryModalVisible(false);
      setSelectedMatch(null);
    } catch (error) {
      console.error('Failed to save success story:', error);
      throw error;
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    // Toast로 삭제 확인
    const showDeleteMatchConfirmToast = (): Promise<'delete' | 'story' | 'cancel'> => {
      return new Promise((resolve) => {
        if (Platform.OS === 'web') {
          const action = window.confirm('매칭 이력을 삭제하시겠습니까?\n\n확인: 삭제\n취소: 성공 스토리 공유');
          resolve(action ? 'delete' : 'story');
        } else {
          Alert.alert(
            '선택하세요',
            '',
            [
              {
                text: '삭제',
                style: 'destructive',
                onPress: () => resolve('delete'),
              },
              {
                text: '성공 스토리 공유',
                onPress: () => resolve('story'),
              },
              { text: '취소', style: 'cancel', onPress: () => resolve('cancel') },
            ],
          );
        }
      });
    };

    const showFinalDeleteConfirm = (): Promise<boolean> => {
      return new Promise((resolve) => {
        if (Platform.OS === 'web') {
          const confirmed = window.confirm('매칭 이력 삭제\n\n이 매칭 이력을 삭제하시겠습니까?');
          resolve(confirmed);
        } else {
          Alert.alert(
            '매칭 이력 삭제',
            '이 매칭 이력을 삭제하시겠습니까?',
            [
              { text: '취소', style: 'cancel', onPress: () => resolve(false) },
              { text: '삭제', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        }
      });
    };

    const action = await showDeleteMatchConfirmToast();
    
    if (action === 'delete') {
      const finalConfirm = await showFinalDeleteConfirm();
      if (finalConfirm) {
        try {
          // AsyncStorage에서 매칭 삭제
          const storedMatches = await AsyncStorage.getItem('interest-matches');
          if (storedMatches) {
            const matches = JSON.parse(storedMatches);
            const updatedMatches = matches.filter((m: any) => m.id !== matchId);
            await AsyncStorage.setItem('interest-matches', JSON.stringify(updatedMatches));
            await fetchMatches(); // 목록 새로고침
            
            Toast.show({
              type: 'success',
              text1: '삭제 완료',
              text2: '매칭 이력이 삭제되었습니다',
              position: 'bottom',
              visibilityTime: 3000,
            });
          }
        } catch (error) {
          console.error('Failed to delete match:', error);
          Toast.show({
            type: 'error',
            text1: '삭제 실패',
            text2: '삭제 중 오류가 발생했습니다',
            position: 'bottom',
            visibilityTime: 3000,
          });
        }
      }
    } else if (action === 'story') {
      const match = matches.find(m => m.id === matchId);
      if (match) handleShareStory(match);
    }
  };

  const renderMatchItem = ({ item }: { item: any }) => {
    return (
      <InterestCard
        item={item}
        isSecure={true}
        isMatch={true}
        onPress={() => handleChatPress(item)}
        onMismatch={() => handleReportMismatch(item)}
      />
    );
  };

  const renderSearchItem = ({ item }: { item: any }) => (
    <InterestCard
      item={item}
      isSecure={true}
      onPress={() => navigation.navigate('AddInterest', { 
        editItem: item,
        relationshipType: selectedTab === 'interest' ? 'romantic' : 'friend' 
      })}
      onDelete={() => handleDeleteSearch(item.id)}
    />
  );

  const renderTabBar = () => (
    <View style={[styles.tabBar, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          selectedTab === 'interest' && [styles.tabButtonActive, { borderBottomColor: colors.PRIMARY }],
        ]}
        onPress={() => setSelectedTab('interest')}
      >
        <Text
          style={[
            styles.tabButtonText,
            selectedTab === 'interest' ? [styles.tabButtonTextActive, { color: colors.PRIMARY }] : { color: colors.TEXT.SECONDARY },
          ]}
        >
          관심상대 찾기
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.tabButton,
          selectedTab === 'friend' && [styles.tabButtonActive, { borderBottomColor: colors.PRIMARY }],
        ]}
        onPress={() => setSelectedTab('friend')}
      >
        <Text
          style={[
            styles.tabButtonText,
            selectedTab === 'friend' ? [styles.tabButtonTextActive, { color: colors.PRIMARY }] : { color: colors.TEXT.SECONDARY },
          ]}
        >
          친구 찾기
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptySection = (title: string, description: string, type: 'search' | 'match') => (
    <View style={[styles.emptySection, { backgroundColor: colors.SURFACE }]}>
      <Icon
        name={type === 'search' ? 'search-outline' : 'heart-outline'}
        size={48}
        color={colors.TEXT.TERTIARY}
      />
      <Text style={[styles.emptyTitle, { color: colors.TEXT.PRIMARY }]}>
        {title}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.TEXT.SECONDARY }]}>
        {description}
      </Text>
      {type === 'search' && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.PRIMARY }]}
          onPress={handleAddInterest}
        >
          <Icon name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>첫 검색 등록하기</Text>
        </TouchableOpacity>
      )}
      {type === 'search' && (
        <View style={styles.tipContainer}>
          <Text style={[styles.tipTitle, { color: colors.TEXT.PRIMARY }]}>
            💡 검색 팁
          </Text>
          <View style={styles.tipList}>
            <View style={styles.tipItem}>
              <Icon name="call-outline" size={16} color={colors.TEXT.SECONDARY} />
              <Text style={[styles.tipText, { color: colors.TEXT.SECONDARY }]}>
                연락처의 전화번호로 아는 사람 찾기
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="location-outline" size={16} color={colors.TEXT.SECONDARY} />
              <Text style={[styles.tipText, { color: colors.TEXT.SECONDARY }]}>
                특정 장소에서 만난 사람 찾기
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="people-outline" size={16} color={colors.TEXT.SECONDARY} />
              <Text style={[styles.tipText, { color: colors.TEXT.SECONDARY }]}>
                같은 그룹에 있는 사람 찾기
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  // 서버 연결 에러 시 에러 화면 표시
  if (serverConnectionError) {
    return (
      <ServerConnectionError 
        onRetry={() => {
          setServerConnectionError(false);
          loadData(true);
        }}
        message="관심상대 정보를 불러올 수 없습니다"
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      {/* 상단 헤더 - 프로필 화면과 동일한 스타일 */}
      <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
        <Text style={[styles.headerTitle, { color: colors.PRIMARY }]}>찾기</Text>
        <Text style={[styles.headerSubtitle, { color: colors.TEXT.PRIMARY }]}>
          관심상대와 친구를 찾아보세요
        </Text>
      </View>
      
      {renderTabBar()}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.PRIMARY]}
            tintColor={colors.PRIMARY}
          />
        }
      >

          <View style={styles.headerActions}>
              <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => handleAddInterest('MY_INFO')}
              >
                  <Icon name="person-circle-outline" size={24} color={colors.PRIMARY} />
                  <Text style={[styles.headerButtonText, { color: colors.PRIMARY }]}>
                      내 정보 등록하기
                  </Text>
                  <Icon name="chevron-forward" size={20} color={colors.PRIMARY} />
              </TouchableOpacity>
              <TouchableOpacity
                  style={[styles.headerButton, { marginTop: 8 }]}
                  onPress={() => handleAddInterest('LOOKING_FOR')}
              >
                  <Icon name="add-circle-outline" size={24} color={colors.SUCCESS} />
                  <Text style={[styles.headerButtonText, { color: colors.SUCCESS }]}>
                      {selectedTab === 'interest' ? '새로운 관심상대 등록하기' : '새로운 친구 찾기'}
                  </Text>
                  <Icon name="chevron-forward" size={20} color={colors.SUCCESS} />
              </TouchableOpacity>
          </View>
          
        {/* 매칭된 항목 섹션 */}
        {filteredMatches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="heart" size={20} color={colors.SUCCESS} />
              <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
                {selectedTab === 'interest' ? `매칭된 관심상대 (${filteredMatches.length})` : `연결된 친구 (${filteredMatches.length})`}
              </Text>
            </View>
            <FlatList
              data={filteredMatches}
              renderItem={renderMatchItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
            />
          </View>
        )}

        {/* 검색 중 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="search" size={20} color={colors.PRIMARY} />
            <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
              {selectedTab === 'interest' ? `등록된 검색 (${filteredSearches.length})` : `친구 찾기 목록 (${filteredSearches.length})`}
            </Text>
          </View>
          {filteredSearches.length > 0 ? (
            <FlatList
              data={filteredSearches}
              renderItem={renderSearchItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            renderEmptySection(
              '등록된 검색이 없습니다',
              '관심있는 사람을 찾기 위해 다양한 조건으로 검색을 등록해보세요',
              'search'
            )
          )}
        </View>

        {/* 플랜 정보 */}
        <View style={[styles.planInfo, { backgroundColor: colors.SURFACE }]}>
          <View style={styles.planHeader}>
            <Icon name="sparkles" size={20} color={colors.WARNING} />
            <View style={styles.planTextContainer}>
              <Text style={[styles.planTitle, { color: colors.TEXT.PRIMARY }]}>
                {subscriptionTier === SubscriptionTier.BASIC ? '무료 플랜' : '프리미엄'} 이용 중
              </Text>
              <Text style={[styles.planDescription, { color: colors.TEXT.SECONDARY }]}>
                등록 가능: {
                  features.interestSearchLimit === 'unlimited' 
                    ? '무제한' 
                    : `${features.interestSearchLimit - filteredSearches.length}개 남음`
                } • 
                유효기간: {features.interestSearchDuration}일
              </Text>
            </View>
          </View>
          {subscriptionTier === SubscriptionTier.BASIC && (
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: colors.PRIMARY }]}
              onPress={() => navigation.navigate('Premium')}
            >
              <Text style={styles.upgradeButtonText}>업그레이드</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      )}

      {selectedMatch && (
        <CreateStoryModal
          visible={storyModalVisible}
          onClose={() => {
            setStoryModalVisible(false);
            setSelectedMatch(null);
          }}
          onSubmit={handleSaveSuccessStory}
          matchInfo={{
            partnerNickname: selectedMatch.matchedUser?.nickname || '익명',
            matchId: selectedMatch.id,
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 1px 3px rgba(0,0,0,0.05)',
      } as any,
    }),
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  tabButtonTextActive: {
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  headerActions: {
    marginTop: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  headerButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  matchCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  matchCardContent: {
    padding: 16,
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  matchTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  matchSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  matchSearchInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  matchSearchLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  matchSearchValue: {
    fontSize: 12,
    marginLeft: 4,
  },
  matchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  storyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  storyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  moreButton: {
    padding: 4,
    marginLeft: 'auto',
  },
  emptySection: {
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  tipContainer: {
    marginTop: 24,
    width: '100%',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  planInfo: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  planTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  planDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  upgradeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

