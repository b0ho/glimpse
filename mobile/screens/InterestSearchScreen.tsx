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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { useInterestStore } from '@/store/slices/interestSlice';
import { InterestCard } from '@/components/interest/InterestCard';
import { InterestEmptyState } from '@/components/interest/InterestEmptyState';
import { useAuthStore } from '@/store/slices/authSlice';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 관심상대 찾기 메인 화면
 */
export const InterestSearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const {
    searches,
    matches,
    loading,
    fetchSearches,
    fetchMatches,
    deleteSearch,
  } = useInterestStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchSearches(),
      fetchMatches(),
    ]);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleAddInterest = () => {
    navigation.navigate('AddInterest');
  };

  const handleDeleteSearch = (searchId: string) => {
    Alert.alert(
      '삭제 확인',
      '이 관심상대 검색을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => deleteSearch(searchId),
        },
      ],
    );
  };

  const handleChatPress = async (item: any) => {
    // 채팅방 정보를 채팅 목록에 추가
    const newChatRoom = {
      id: `interest-${item.searchId || item.id}`,
      matchId: item.matchedUserId || item.matchedUser?.id,
      otherUserNickname: item.matchedUser?.nickname || '익명',
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
      const roomExists = existingRooms.some((room: any) => room.id === newChatRoom.id);
      if (!roomExists) {
        existingRooms.push(newChatRoom);
        await AsyncStorage.setItem('chat-rooms', JSON.stringify(existingRooms));
      }
    } catch (error) {
      console.error('Failed to save chat room:', error);
    }
    
    // 매칭된 상대와 채팅 시작
    navigation.navigate('Chat', {
      roomId: newChatRoom.id,
      matchId: item.matchedUserId || item.matchedUser?.id,
      otherUserNickname: item.matchedUser?.nickname || '익명',
    });
  };

  const getSearchInfo = (match: any) => {
    // 매칭 데이터에 직접 포함된 정보 사용
    if (match.matchType && match.matchValue) {
      const typeLabels = {
        PHONE: '전화번호',
        EMAIL: '이메일',
        SOCIAL_ID: '소셜계정',
        GROUP: '특정 그룹',
        LOCATION: '장소',
        APPEARANCE: '인상착의',
        NICKNAME: '닉네임',
        COMPANY: '회사',
        SCHOOL: '학교',
        HOBBY: '취미/관심사',
      };

      return {
        type: typeLabels[match.matchType] || match.matchType,
        value: match.matchValue,
      };
    }

    // 매칭과 연결된 검색 정보 찾기 (fallback)
    const search = searches.find(s => s.id === match.searchId);
    if (!search) return null;

    const typeLabels = {
      PHONE: '전화번호',
      EMAIL: '이메일',
      SOCIAL_ID: '소셜계정',
      GROUP: '특정 그룹',
      LOCATION: '장소',
      APPEARANCE: '인상착의',
      NICKNAME: '닉네임',
      COMPANY: '회사',
      SCHOOL: '학교',
      HOBBY: '취미/관심사',
    };

    return {
      type: typeLabels[search.type] || search.type,
      value: search.value,
    };
  };

  const handleDeleteMatch = (matchId: string) => {
    Alert.alert(
      '선택하세요',
      '',
      [
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '매칭 이력 삭제',
              '이 매칭 이력을 삭제하시겠습니까?',
              [
                { text: '취소', style: 'cancel' },
                {
                  text: '삭제',
                  style: 'destructive',
                  onPress: async () => {
                    // AsyncStorage에서 매칭 삭제
                    const storedMatches = await AsyncStorage.getItem('interest-matches');
                    if (storedMatches) {
                      const matches = JSON.parse(storedMatches);
                      const updatedMatches = matches.filter((m: any) => m.id !== matchId);
                      await AsyncStorage.setItem('interest-matches', JSON.stringify(updatedMatches));
                      await fetchMatches(); // 목록 새로고침
                    }
                  },
                },
              ],
            );
          },
        },
        { text: '취소', style: 'cancel' },
      ],
    );
  };

  const renderMatchItem = ({ item }: { item: any }) => {
    const searchInfo = getSearchInfo(item);
    
    return (
      <View style={[styles.matchCard, { backgroundColor: colors.SUCCESS + '10', borderColor: colors.SUCCESS }]}>
        <View style={styles.matchCardContent}>
          <View style={styles.matchInfo}>
            <Icon name="heart" size={24} color={colors.SUCCESS} />
            <View style={styles.matchTextContainer}>
              <Text style={[styles.matchTitle, { color: colors.TEXT.PRIMARY }]}>
                매칭 성공!
              </Text>
              <Text style={[styles.matchSubtitle, { color: colors.TEXT.SECONDARY }]}>
                {item.matchedUser?.nickname || '익명'} 님과 매칭되었습니다
              </Text>
              {searchInfo && (
                <View style={styles.matchSearchInfoContainer}>
                  <Text style={[styles.matchSearchLabel, { color: colors.TEXT.SECONDARY }]}>
                    {searchInfo.type}:
                  </Text>
                  <Text style={[styles.matchSearchValue, { color: colors.TEXT.PRIMARY }]}>
                    {searchInfo.value}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.matchActions}>
            <TouchableOpacity
              style={[styles.chatButton, { backgroundColor: colors.PRIMARY }]}
              onPress={() => handleChatPress(item)}
            >
              <Icon name="chatbubble" size={18} color="#FFFFFF" />
              <Text style={styles.chatButtonText}>채팅하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => handleDeleteMatch(item.id)}
            >
              <Icon name="ellipsis-vertical" size={20} color={colors.TEXT.SECONDARY} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderSearchItem = ({ item }: { item: any }) => (
    <InterestCard
      item={item}
      onPress={() => {}}
      onDelete={() => handleDeleteSearch(item.id)}
      isMatch={false}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: colors.SURFACE }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.TEXT.PRIMARY }]}>
            관심상대 찾기
          </Text>
        </View>
        
        {/* 내 정보 등록 버튼 */}
        <TouchableOpacity
          style={[styles.myInfoButton, { backgroundColor: colors.BACKGROUND, borderColor: colors.PRIMARY }]}
          onPress={() => navigation.navigate('MyInfo')}
        >
          <Icon name="person-circle-outline" size={20} color={colors.PRIMARY} />
          <Text style={[styles.myInfoButtonText, { color: colors.PRIMARY }]}>
            내 정보 등록하기
          </Text>
          <Icon name="chevron-forward" size={16} color={colors.PRIMARY} />
        </TouchableOpacity>
        
        {/* 관심상대 등록 버튼 - 홈 화면과 비슷한 스타일 */}
        <TouchableOpacity
          style={[styles.registerButton, { backgroundColor: colors.SURFACE, borderColor: colors.PRIMARY + '20' }]}
          onPress={handleAddInterest}
        >
          <Icon name="search" size={20} color={colors.PRIMARY} />
          <Text style={[styles.registerButtonText, { color: colors.TEXT.PRIMARY }]}>
            새로운 관심상대 등록하기
          </Text>
          <Icon name="chevron-forward" size={16} color={colors.TEXT.SECONDARY} />
        </TouchableOpacity>
      </View>

      {/* 콘텐츠 */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.PRIMARY]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 매칭된 항목 섹션 */}
        {matches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="heart" size={20} color={colors.SUCCESS} />
              <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
                매칭 성공! ({matches.length})
              </Text>
            </View>
            <FlatList
              data={matches}
              renderItem={renderMatchItem}
              keyExtractor={(item) => item.id || item.searchId}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          </View>
        )}

        {/* 등록된 검색 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="search" size={20} color={colors.PRIMARY} />
            <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
              등록된 검색 ({searches.length})
            </Text>
          </View>
          {loading && searches.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.PRIMARY} />
            </View>
          ) : searches.length === 0 ? (
            <InterestEmptyState
              type="searches"
              onAddPress={handleAddInterest}
            />
          ) : (
            <FlatList
              data={searches}
              renderItem={renderSearchItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          )}
        </View>
      </ScrollView>

      {/* 프리미엄 프로모션 (일반 사용자) */}
      {!user?.isPremium && searches.length >= 3 && (
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.premiumBanner}
        >
          <View style={styles.premiumContent}>
            <Icon name="star" size={20} color="#FFFFFF" />
            <Text style={styles.premiumText}>
              프리미엄으로 더 많은 검색을 등록하세요!
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Premium')}
              style={styles.premiumButton}
            >
              <Text style={styles.premiumButtonText}>업그레이드</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  myInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    marginBottom: 10,
  },
  myInfoButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
  },
  registerButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  matchCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    minHeight: 120,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  matchCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  matchTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  matchSubtitle: {
    fontSize: 14,
  },
  matchSearchInfoContainer: {
    flexDirection: 'row',
    marginTop: 4,
    alignItems: 'center',
  },
  matchSearchLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  matchSearchValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  matchActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreButton: {
    marginLeft: 10,
    padding: 5,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  loadingContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  premiumButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  premiumButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});