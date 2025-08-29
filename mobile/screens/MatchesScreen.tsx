import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useLikeStore } from '@/store/slices/likeSlice';
import { useAuthStore } from '@/store/slices/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { Match } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { formatTimeAgo } from '@/utils/dateUtils';
import { matchApi } from '@/services/api/matchApi';

/**
 * 매칭 화면 컴포넌트 - 서로 좋아요한 사용자 목록
 * @component
 * @returns {JSX.Element} 매칭 화면 UI
 * @description 서로 좋아요를 보내 매칭된 사용자 목록을 표시하고 채팅을 시작할 수 있는 화면
 */
export const MatchesScreen = React.memo(() => {
  console.log('[MatchesScreen] 컴포넌트 렌더링');
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigation = useNavigation();
  const likeStore = useLikeStore();
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation('matches');

  /**
   * 매칭 데이터 로드
   * @effect
   * @description 서버에서 매칭 목록을 가져와 표시
   */
  useEffect(() => {
    console.log('[MatchesScreen] useEffect 실행됨, isLoading:', isLoading);
    
    // 이미 로드된 경우 스킵
    if (!isLoading) {
      console.log('[MatchesScreen] 이미 로드됨, 스킵');
      return;
    }
    
    // API에서 매칭 데이터 로드
    const loadMatches = async () => {
      try {
        console.log('[MatchesScreen] API에서 매칭 데이터 로드 시작');
        const matchData = await matchApi.getMatches();
        console.log('[MatchesScreen] 매칭 데이터 로드 성공:', matchData.length);
        setMatches(matchData);
        likeStore.setMatches(matchData);
        console.log('[MatchesScreen] setIsLoading(false) 호출');
        setIsLoading(false);
      } catch (error) {
        console.error('[MatchesScreen] Failed to load matches:', error);
        // API 실패 시 빈 배열로 설정
        setMatches([]);
        setIsLoading(false);
      }
    };
    
    loadMatches();
    
    // Cleanup 함수
    return () => {
      console.log('[MatchesScreen] 컴포넌트 언마운트됨');
    };
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
   * 미스매치 신고 핸들러
   * @param {string} matchId - 매칭 ID
   * @param {string} nickname - 상대방 닉네임
   * @description 잘못된 매칭을 신고하고 다시 대기 상태로 전환
   */
  const handleReportMismatch = (matchId: string, nickname: string) => {
    Alert.alert(
      t('matches:mismatch.reportTitle'),
      t('matches:mismatch.reportMessage', { nickname }),
      [
        {
          text: t('matches:mismatch.cancel'),
          style: 'cancel',
        },
        {
          text: t('matches:mismatch.report'),
          style: 'destructive',
          onPress: async () => {
            try {
              // API 호출하여 미스매치 신고
              await matchApi.reportMismatch(matchId, '사용자가 미스매치를 신고했습니다.');
              
              // 매칭 목록에서 제거
              setMatches(prevMatches => prevMatches.filter(m => m.id !== matchId));
              
              Alert.alert(
                t('matches:mismatch.reportCompleteTitle'),
                t('matches:mismatch.reportCompleteMessage'),
                [{ text: t('matches:mismatch.confirm') }]
              );
            } catch (error) {
              console.error('[MatchesScreen] Failed to report mismatch:', error);
              Alert.alert(
                t('matches:mismatch.errorTitle'),
                t('matches:mismatch.errorMessage'),
                [{ text: t('matches:mismatch.confirm') }]
              );
            }
          },
        },
      ]
    );
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
      : t('matches:user.anonymous');

    return (
      <View style={[styles.matchItem, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
        <View style={styles.matchHeader}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: colors.PRIMARY }]}>
              <Text style={[styles.avatarText, { color: colors.TEXT.WHITE }]}>
                {displayName.charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={[styles.nickname, { color: colors.TEXT.PRIMARY }]}>{displayName}</Text>
              <Text style={[styles.matchTime, { color: colors.TEXT.SECONDARY }]}>
                {formatTimeAgo(new Date(item.matchedAt || item.createdAt))}
              </Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.chatButton, { backgroundColor: colors.PRIMARY }]}
              onPress={() => handleStartChat(item.id, displayName)}
            >
              <Text style={[styles.chatButtonText, { color: colors.TEXT.WHITE }]}>{t('matches:actions.startChat')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.mismatchButton, { backgroundColor: colors.ERROR }]}
              onPress={() => handleReportMismatch(item.id, displayName)}
            >
              <Text style={[styles.mismatchButtonText, { color: colors.TEXT.WHITE }]}>⚠️</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={[styles.matchDescription, { color: colors.TEXT.SECONDARY }]}>
          {t('matches:messages.matchDescription')}
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
    <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
      <Text style={[styles.headerTitle, { color: colors.PRIMARY }]}>{t('matches:header.title')}</Text>
      <Text style={[styles.headerSubtitle, { color: colors.TEXT.SECONDARY }]}>
        {t('matches:header.subtitle')}
      </Text>
      <View style={styles.statsContainer}>
        <Text style={[styles.statsText, { color: colors.TEXT.PRIMARY }]}>
          {t('matches:stats.totalMatches', { count: matches.length })}
        </Text>
        <Text style={[styles.statsText, { color: colors.TEXT.PRIMARY }]}>
          {t('matches:stats.receivedLikes', { count: likeStore.getReceivedLikesCount() })}
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
      <Text style={styles.emptyStateEmoji}>💬</Text>
      <Text style={[styles.emptyStateTitle, { color: colors.PRIMARY }]}>{t('matches:emptyState.title')}</Text>
      <Text style={[styles.emptyStateSubtitle, { color: colors.TEXT.SECONDARY }]}>
        {t('matches:emptyState.subtitle')}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView 
        style={[styles.container, { backgroundColor: colors.BACKGROUND }]} 
        edges={Platform.OS === 'android' ? ['top'] : ['top', 'bottom']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text style={[styles.loadingText, { color: colors.TEXT.PRIMARY }]}>{t('common:loading.text')}</Text>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '500',
  },
  matchItem: {
    marginVertical: SPACING.XS,
    marginHorizontal: SPACING.MD,
    borderRadius: 12,
    padding: SPACING.MD,
    elevation: 2,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  avatarText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
  },
  nickname: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  matchTime: {
    fontSize: FONT_SIZES.SM,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  chatButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
  },
  chatButtonText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  mismatchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mismatchButtonText: {
    fontSize: FONT_SIZES.MD,
  },
  matchDescription: {
    fontSize: FONT_SIZES.SM,
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
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: FONT_SIZES.MD,
    textAlign: 'center',
    lineHeight: 22,
  },
});