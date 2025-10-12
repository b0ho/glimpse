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
import { cn } from '@/utils/cn';
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

/**
 * 매칭 화면 컴포넌트 - 서로 좋아요한 사용자 목록
 * @component
 * @returns {JSX.Element} 매칭 화면 UI
 * @description 서로 좋아요를 보내 매칭된 사용자 목록을 표시하고 채팅을 시작할 수 있는 화면
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
  const { t } = useAndroidSafeTranslation(['matches', 'common']);

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
        setServerConnectionError(false);
        const matchData = await matchApi.getMatches();
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
      <View className="mx-4 my-2 rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm">
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center flex-1">
            <View className="w-[50px] h-[50px] rounded-full items-center justify-center mr-4 bg-primary">
              <Text className="text-lg font-bold text-white">
                {displayName.charAt(0)}
              </Text>
            </View>
            <View>
              <Text className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">{displayName}</Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                {formatTimeAgo(item.matchedAt || item.createdAt)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              className="px-4 py-2 rounded-lg bg-primary"
              onPress={() => handleStartChat(item.id, displayName)}
            >
              <Text className="text-sm font-semibold text-white">{t('matches:actions.startChat')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-9 h-9 rounded-full items-center justify-center bg-red-500"
              onPress={() => handleReportMismatch(item.id, displayName)}
            >
              <Text className="text-base text-white">⚠️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text className="text-sm leading-5 text-center italic text-gray-600 dark:text-gray-400">
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
    <View className="px-6 py-6 border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <Text className="text-2xl font-bold mb-1 text-primary">{t('matches:header.title')}</Text>
      <Text className="text-base mb-4 text-gray-600 dark:text-gray-400">
        {t('matches:header.subtitle')}
      </Text>
      <View className="flex-row justify-between">
        <Text className="text-sm font-medium text-gray-900 dark:text-white">
          {t('matches:stats.totalMatches', { count: matches.length })}
        </Text>
        <Text className="text-sm font-medium text-gray-900 dark:text-white">
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
      <Text className="text-6xl mb-6">💬</Text>
      <Text className="text-lg font-bold mb-2 text-center text-primary">{t('matches:emptyState.title')}</Text>
      <Text className="text-base text-center leading-5.5 text-gray-600 dark:text-gray-400">
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
              const matchData = await matchApi.getMatches();
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
        message={t('common:errors.loadErrors.matches')}
      />
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-gray-50 dark:bg-gray-900"
        edges={Platform.OS === 'android' ? ['top'] : ['top', 'bottom']}
      >
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text className="mt-4 text-base text-gray-900 dark:text-white">{t('common:loading.text')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50 dark:bg-gray-900"
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