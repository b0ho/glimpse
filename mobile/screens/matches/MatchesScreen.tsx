import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useLikeStore } from '@/store/slices/likeSlice';
import { useAuthStore } from '@/store/slices/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { Match } from '@/types';
import { formatTimeAgo } from '@/utils/dateUtils';
import { matchApi } from '@/services/api/matchApi';
import { ServerConnectionError } from '@/components/ServerConnectionError';
import { cn } from '@/lib/utils';

/**
 * 매칭 화면 컴포넌트 - NativeWind 버전
 *
 * @component
 * @returns {JSX.Element}
 *
 * @description
 * 서로 좋아요를 보내 매칭된 사용자 목록을 표시하고 채팅을 시작할 수 있는 화면입니다:
 * - 매칭된 상대방 목록 표시
 * - 채팅 시작 기능
 * - 미스매치 신고 기능
 * - 매칭 통계 정보
 *
 * @features
 * - 익명성 해제: 매칭 후 상대방 닉네임 공개
 * - 실시간 매칭 데이터 로드
 * - 서버 연결 에러 핸들링
 * - 매칭 통계 (총 매칭 수, 받은 좋아요 수)
 * - 다크모드 지원
 *
 * @navigation
 * - From: MainTabs (매칭 탭)
 * - To: Chat (채팅 화면)
 *
 * @example
 * ```tsx
 * <Tab.Screen name="Matches" component={MatchesScreen} />
 * ```
 */
export const MatchesScreen = React.memo(() => {
  console.log('[MatchesScreen] 컴포넌트 렌더링');
  const isFocused = useIsFocused();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serverConnectionError, setServerConnectionError] = useState(false);
  
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

        // userId 확인
        if (!user?.id) {
          console.error('[MatchesScreen] user.id가 없습니다');
          setServerConnectionError(true);
          setIsLoading(false);
          return;
        }

        setServerConnectionError(false);
        const matchData = await matchApi.getMatches(user.id);
        console.log('[MatchesScreen] 매칭 데이터 로드 성공:', matchData.length);
        setMatches(matchData);
        likeStore.setMatches(matchData);
        console.log('[MatchesScreen] setIsLoading(false) 호출');
        setIsLoading(false);
      } catch (error) {
        console.error('[MatchesScreen] Failed to load matches:', error);
        // 서버 연결 실패 시 에러 화면 표시
        setMatches([]);
        setServerConnectionError(true);
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
      <View className="my-1 mx-4 rounded-xl p-4 shadow-md bg-white dark:bg-gray-900">
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 rounded-full bg-primary-500 justify-center items-center mr-3">
              <Text className="text-white text-lg font-bold">
                {displayName.charAt(0)}
              </Text>
            </View>
            <View>
              <Text className="text-lg font-bold mb-0.5 text-gray-900 dark:text-white">{displayName}</Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                {formatTimeAgo(item.matchedAt || item.createdAt)}
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              className="bg-primary-500 px-4 py-2 rounded-lg"
              onPress={() => handleStartChat(item.id, displayName)}
            >
              <Text className="text-white text-sm font-semibold">{t('matches:actions.startChat')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="w-9 h-9 bg-red-500 rounded-full justify-center items-center"
              onPress={() => handleReportMismatch(item.id, displayName)}
            >
              <Text className="text-white text-base">⚠️</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <Text className="text-sm text-center italic leading-5 text-gray-600 dark:text-gray-400">
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
    <View className="px-5 py-5 border-b bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <Text className="text-primary-500 text-2xl font-bold mb-1">{t('matches:header.title')}</Text>
      <Text className="text-base mb-3 text-gray-600 dark:text-gray-400">
        {t('matches:header.subtitle')}
      </Text>
      <View className="flex-row justify-between">
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('matches:stats.totalMatches', { count: matches.length })}
        </Text>
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
    <View className="flex-1 justify-center items-center px-8">
      <Text className="text-6xl mb-5">💬</Text>
      <Text className="text-primary-500 text-lg font-bold mb-2 text-center">{t('matches:emptyState.title')}</Text>
      <Text className="text-base text-center leading-6 text-gray-600 dark:text-gray-400">
        {t('matches:emptyState.subtitle')}
      </Text>
    </View>
  );

  // 웹에서 포커스되지 않은 경우 빈 View 반환
  if (Platform.OS === 'web' && !isFocused) {
    return <View className="flex-1" />;
  }

  // 서버 연결 에러 시 에러 화면 표시
  if (serverConnectionError) {
    return (
      <ServerConnectionError
        onRetry={async () => {
          setServerConnectionError(false);
          setIsLoading(true);
          const loadMatches = async () => {
            try {
              if (!user?.id) {
                console.error('[MatchesScreen] user.id가 없습니다');
                setServerConnectionError(true);
                setIsLoading(false);
                return;
              }
              const matchData = await matchApi.getMatches(user.id);
              setMatches(matchData);
              likeStore.setMatches(matchData);
              setIsLoading(false);
            } catch (error) {
              console.error('[MatchesScreen] Failed to load matches:', error);
              setMatches([]);
              setServerConnectionError(true);
              setIsLoading(false);
            }
          };
          await loadMatches();
        }}
        message="매칭 정보를 불러올 수 없습니다"
      />
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView 
        className="flex-1 bg-gray-50 dark:bg-gray-950"
        edges={Platform.OS === 'android' ? ['top'] : ['top', 'bottom']}
      >
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text className="mt-3 text-base text-gray-700 dark:text-gray-300">{t('common:loading.text')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView 
      className="flex-1 bg-gray-50 dark:bg-gray-950"
      edges={Platform.OS === 'android' ? ['top'] : ['top', 'bottom']}
    >
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={renderMatchItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={matches.length === 0 ? { flexGrow: 1 } : undefined}
      />
    </SafeAreaView>
  );
});