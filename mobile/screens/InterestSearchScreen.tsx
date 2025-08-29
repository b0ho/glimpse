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
import { useNavigation } from '@react-navigation/native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useInterestStore } from '@/store/slices/interestSlice';
import { InterestCard } from '@/components/interest/InterestCard';
import { InterestEmptyState } from '@/components/interest/InterestEmptyState';
import { useAuthStore } from '@/store/slices/authSlice';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CreateStoryModal } from '@/components/successStory/CreateStoryModal';
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
  
  const subscriptionTier = getSubscriptionTier();
  const features = getSubscriptionFeatures();

  // 탭에 따라 필터링된 데이터
  const filteredSearches = searches.filter(search => {
    const relationshipIntent = search.metadata?.relationshipIntent?.toLowerCase();
    return relationshipIntent === (selectedTab === 'interest' ? 'romantic' : 'friend');
  });
  
  const filteredMatches = matches.filter(match => {
    const relationshipIntent = match.metadata?.relationshipIntent?.toLowerCase();
    return relationshipIntent === (selectedTab === 'interest' ? 'romantic' : 'friend');
  });

  useEffect(() => {
    loadData();
    // 개발 모드에서 테스트 데이터 생성
    if (__DEV__) {
      createTestMatches();
    }
  }, []);

  const createTestMatches = async () => {
    try {
      const testMatches = [
        {
          id: 'test-match-1',
          matchType: InterestType.PHONE,
          matchValue: '010-1234-5678',
          status: 'MATCHED',
          matchedUser: {
            id: 'user-1',
            nickname: '김민수',
            profileImage: null,
          },
          matchedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: 'test-match-2',
          matchType: InterestType.COMPANY,
          matchValue: '삼성전자',
          status: 'MATCHED',
          matchedUser: {
            id: 'user-2',
            nickname: '이서연',
            profileImage: null,
          },
          matchedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        },
      ];
      
      await AsyncStorage.setItem('interest-matches', JSON.stringify(testMatches));
      await fetchMatches();
    } catch (error) {
      console.error('Failed to create test matches:', error);
    }
  };

  const loadData = async () => {
    try {
      await Promise.all([
        fetchSearches().catch(err => {
          console.log('[InterestSearchScreen] fetchSearches error:', err);
        }),
        fetchMatches().catch(err => {
          console.log('[InterestSearchScreen] fetchMatches error:', err);
        }),
      ]);
    } catch (error) {
      console.error('[InterestSearchScreen] loadData error:', error);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleAddInterest = () => {
    // BASIC (무료) 계정 제한 확인
    if (subscriptionTier === SubscriptionTier.BASIC) {
      // 현재 등록된 유형 개수 확인
      const uniqueTypes = new Set(searches.map(s => s.type));
      
      if (uniqueTypes.size >= 3) {
        Toast.show({
          type: 'info',
          text1: '구독 제한',
          text2: '무료 사용자는 최대 3개 유형까지 등록 가능합니다',
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
      searches.forEach(search => {
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
    
    navigation.navigate('AddInterest', { 
      relationshipType: selectedTab === 'interest' ? 'romantic' : 'friend' 
    });
  };

  const handleDeleteSearch = async (searchId: string) => {
    // Toast로 삭제 확인 및 결과 표시
    const showConfirmToast = (): Promise<boolean> => {
      return new Promise((resolve) => {
        if (Platform.OS === 'web') {
          const confirmed = window.confirm('이 관심상대 검색을 삭제하시겠습니까?\n삭제하면 검색 등록 횟수가 복구됩니다.');
          resolve(confirmed);
        } else {
          Alert.alert(
            '삭제 확인',
            '이 관심상대 검색을 삭제하시겠습니까?\n삭제하면 검색 등록 횟수가 복구됩니다.',
            [
              { text: '취소', style: 'cancel', onPress: () => resolve(false) },
              { text: '삭제', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        }
      });
    };

    const confirmed = await showConfirmToast();

    if (confirmed) {
      try {
        await deleteSearch(searchId);
        // 삭제 성공 시 데이터 새로고침
        await fetchSearches();
        
        Toast.show({
          type: 'success',
          text1: '삭제 완료',
          text2: '관심상대 검색이 삭제되었습니다',
          position: 'bottom',
          visibilityTime: 3000,
        });
      } catch (error) {
        console.error('Failed to delete search:', error);
        Toast.show({
          type: 'error',
          text1: '삭제 실패',
          text2: '삭제 중 오류가 발생했습니다. 다시 시도해주세요',
          position: 'bottom',
          visibilityTime: 3000,
        });
      }
    }
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
        isMatch={true}
        onPress={() => handleChatPress(item)}
        onMismatch={() => handleReportMismatch(item)}
      />
    );
  };

  const renderSearchItem = ({ item }: { item: any }) => (
    <InterestCard
      item={item}
      onDelete={() => handleDeleteSearch(item.id)}
      onEdit={() => navigation.navigate('AddInterest', { 
        editItem: item,
        relationshipType: selectedTab === 'interest' ? 'romantic' : 'friend' 
      })}
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
                  onPress={() => navigation.navigate('MyInfo')}
              >
                  <Icon name="person-circle-outline" size={24} color={colors.PRIMARY} />
                  <Text style={[styles.headerButtonText, { color: colors.PRIMARY }]}>
                      내 정보 등록하기
                  </Text>
                  <Icon name="chevron-forward" size={20} color={colors.PRIMARY} />
              </TouchableOpacity>
              <TouchableOpacity
                  style={[styles.headerButton, { marginTop: 8 }]}
                  onPress={handleAddInterest}
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