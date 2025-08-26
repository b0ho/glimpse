/**
 * 채팅 화면 컴포넌트 - 실시간 메시징 및 채팅 기능
 * @component  
 * @returns {JSX.Element} 채팅 화면 UI
 * @description 1:1 실시간 채팅, 메시지 암호화, 영상/음성 통화 기능을 제공하는 화면
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useChatStore, chatSelectors } from '@/store/slices/chatSlice';
import { useAuthStore } from '@/store/slices/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageInput } from '@/components/chat/MessageInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { CallButton } from '@/components/call/CallButton';
import { useCall } from '@/providers/CallProvider';
import { Message } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

/**
 * 채팅 화면 라우트 파라미터 타입
 * @typedef {Object} ChatScreenParams
 * @property {string} roomId - 채팅방 ID
 * @property {string} matchId - 매칭 ID
 * @property {string} otherUserNickname - 상대방 닉네임
 */
type ChatScreenRouteProp = RouteProp<{
  Chat: {
    roomId: string;
    matchId: string;
    otherUserNickname: string;
  };
}, 'Chat'>;

/**
 * 채팅 화면 컴포넌트
 * @component
 * @returns {JSX.Element} 채팅 화면 UI
 */
export const ChatScreen = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation();
  const { roomId, matchId, otherUserNickname } = route.params;
  const { initiateCall, isInCall } = useCall();
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation('chat');

  // Store states
  const authStore = useAuthStore();
  const {
    isLoading,
    error,
    activeRoomId,
    initializeChat,
    setActiveRoom,
    loadMessages,
    sendMessage,
    markMessageAsRead,
    setTypingStatus,
    clearError,
  } = useChatStore();

  // Local states
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const isNearBottom = useRef(true);

  // Selectors
  const roomMessages = useChatStore(chatSelectors.getMessages(roomId));
  const typingUsers = useChatStore(chatSelectors.getTypingUsers(roomId));
  const isOtherUserTyping = typingUsers.some(user => user.userId !== authStore.user?.id);

  /**
   * 채팅방 초기화 및 메시지 로드
   * @effect
   * @description WebSocket 연결, 채팅방 활성화, 메시지 로드를 처리
   */
  useEffect(() => {
    let mounted = true;
    
    const initChat = async () => {
      if (!authStore.user?.id || !authStore.token) {
        Alert.alert(t('chat:errors.error'), t('chat:errors.loginRequired'));
        navigation.goBack();
        return;
      }

      if (isInitialized || !mounted) return; // 이미 초기화된 경우 건너뛰기

      try {
        // 채팅 시스템 초기화
        await initializeChat(authStore.user.id, authStore.token);
        if (mounted) {
          setIsInitialized(true);
          
          // 채팅방 활성화
          setActiveRoom(roomId);
          
          // 메시지 로드
          await loadMessages(roomId);
        }
      } catch (error) {
        if (mounted) {
          console.error('Chat initialization failed:', error);
          Alert.alert(t('chat:errors.error'), t('chat:errors.chatLoadFailed'));
        }
      }
    };

    if (!isInitialized) {
      initChat();
    }

    // 화면을 벗어날 때 채팅방에서 나가기
    return () => {
      mounted = false;
      setActiveRoom(null);
    };
  }, [roomId]);

  /**
   * 네비게이션 헤더 설정
   * @effect
   * @description 채팅방 제목, 통화 버튼 등 헤더 UI를 설정
   */
  useEffect(() => {
    navigation.setOptions({
      title: otherUserNickname,
      headerStyle: {
        backgroundColor: colors.SURFACE,
      },
      headerTintColor: colors.PRIMARY,
      headerTitleStyle: {
        fontSize: FONT_SIZES.LG,
        fontWeight: '600',
      },
      headerRight: () => (
        <View style={styles.headerButtons}>
          <CallButton
            type="audio"
            onPress={() => handleCall('audio')}
            disabled={isInCall}
            size={20}
          />
          <CallButton
            type="video"
            onPress={() => handleCall('video')}
            disabled={isInCall}
            size={20}
          />
        </View>
      ),
    });
  }, [navigation, otherUserNickname, isInCall]);

  /**
   * 통화 시작 핸들러
   * @param {'video' | 'audio'} callType - 통화 유형
   * @description 영상 또는 음성 통화를 시작하는 함수
   */
  const handleCall = useCallback((callType: 'video' | 'audio') => {
    // matchId에서 상대방 userId 추출 (실제로는 API에서 가져와야 함)
    const otherUserId = matchId; // 임시로 matchId 사용
    initiateCall(otherUserId, otherUserNickname, callType);
  }, [matchId, otherUserNickname, initiateCall]);

  /**
   * 메시지 전송 핸들러
   * @param {string} content - 메시지 내용
   * @param {'TEXT' | 'IMAGE' | 'VOICE' | 'LOCATION' | 'STORY_REPLY'} [type='TEXT'] - 메시지 유형
   * @returns {Promise<void>}
   * @description 메시지를 암호화하여 전송하고 UI를 업데이트하는 함수
   */
  const handleSendMessage = useCallback(async (content: string, type?: 'TEXT' | 'IMAGE' | 'VOICE' | 'LOCATION' | 'STORY_REPLY') => {
    try {
      await sendMessage(roomId, content, type);
      
      // 새 메시지 전송 후 하단으로 스크롤
      setTimeout(() => {
        if (isNearBottom.current) {
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      }, 100);
    } catch (error) {
      console.error('Send message failed:', error);
      // 에러는 store에서 처리됨
    }
  }, [roomId, sendMessage]);

  /**
   * 타이핑 상태 변경 핸들러
   * @param {boolean} isTyping - 타이핑 여부
   * @description 사용자의 타이핑 상태를 실시간으로 전달하는 함수
   */
  const handleTypingStatusChange = useCallback((isTyping: boolean) => {
    setTypingStatus(roomId, isTyping);
  }, [roomId, setTypingStatus]);

  /**
   * 메시지 길게 누르기 핸들러
   * @param {Message} message - 메시지 객체
   * @description 메시지 복사, 삭제 등의 옵션을 제공하는 함수
   */
  const handleMessageLongPress = useCallback((message: Message) => {
    Alert.alert(
      t('chat:errors.messageOptions'),
      t('chat:errors.copyConfirm'),
      [
        { text: t('chat:errors.cancel'), style: 'cancel' },
        {
          text: t('chat:errors.copy'),
          onPress: () => {
            // 실제 구현에서는 Clipboard API 사용
            console.log('Copy message:', message.content);
            Alert.alert(t('common:buttons.done'), t('chat:errors.copySuccess'));
          },
        },
      ]
    );
  }, [t]);

  /**
   * 추가 메시지 로드 (페이지네이션)
   * @returns {Promise<void>}
   * @description 스크롤 시 이전 메시지를 추가로 로드하는 함수
   */
  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || isLoading) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      await loadMessages(roomId, nextPage);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Load more messages failed:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [roomId, currentPage, isLoadingMore, isLoading, loadMessages]);

  /**
   * 스크롤 이벤트 핸들러
   * @param {Object} event - 스크롤 이벤트 객체
   * @description 사용자의 스크롤 위치를 추적하여 자동 스크롤 여부를 결정
   */
  const handleScroll = useCallback((event: {nativeEvent: {layoutMeasurement: {height: number}, contentOffset: {y: number}, contentSize: {height: number}}}) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    isNearBottom.current = layoutMeasurement.height + contentOffset.y >= 
      contentSize.height - paddingToBottom;
  }, []);

  /**
   * 메시지 읽음 표시 핸들러
   * @param {Object} params - 보이는 아이템 정보
   * @param {Array<{item: Message}>} params.viewableItems - 화면에 보이는 메시지 목록
   * @description 화면에 표시된 메시지를 읽음 처리하는 함수
   */
  const handleViewableItemsChanged = useCallback(({ viewableItems }: {viewableItems: Array<{item: Message}>}) => {
    viewableItems.forEach((item: {item: Message}) => {
      const message: Message = item.item;
      if (!message.isRead && message.senderId !== authStore.user?.id) {
        markMessageAsRead(message.id, roomId);
      }
    });
  }, [authStore.user?.id, roomId, markMessageAsRead]);

  /**
   * 메시지 아이템 렌더링
   * @param {Object} params - 리스트 아이템 파라미터
   * @param {Message} params.item - 메시지 객체
   * @param {number} params.index - 메시지 인덱스
   * @returns {JSX.Element} 메시지 버블 UI
   */
  const renderMessageItem = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.senderId === authStore.user?.id;
    const previousMessage = index > 0 ? roomMessages[index - 1] : null;
    const showAvatar = !isOwnMessage && (
      !previousMessage || 
      previousMessage.senderId !== item.senderId ||
      new Date(item.createdAt).getTime() - new Date(previousMessage.createdAt).getTime() > 300000 // 5분
    );

    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        showAvatar={showAvatar}
        onLongPress={handleMessageLongPress}
      />
    );
  };

  /**
   * 리스트 헤더 렌더링
   * @returns {JSX.Element | null} 로딩 인디케이터 UI
   * @description 이전 메시지 로딩 상태를 표시
   */
  const renderListHeader = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={colors.PRIMARY} />
        <Text style={[styles.loadingMoreText, { color: colors.TEXT.SECONDARY }]}>{t('chat:loading.previousMessages')}</Text>
      </View>
    );
  };

  /**
   * 리스트 푸터 렌더링
   * @returns {JSX.Element} 타이핑 인디케이터 UI
   * @description 상대방의 타이핑 상태를 표시
   */
  const renderListFooter = () => {
    return (
      <TypingIndicator 
        isTyping={isOtherUserTyping}
        userName={otherUserNickname}
      />
    );
  };

  /**
   * 빈 상태 렌더링
   * @returns {JSX.Element} 빈 상태 UI
   * @description 메시지가 없을 때 표시되는 UI
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateEmoji}>💬</Text>
      <Text style={[styles.emptyStateTitle, { color: colors.TEXT.PRIMARY }]}>{t('chat:emptyState.title')}</Text>
      <Text style={[styles.emptyStateSubtitle, { color: colors.TEXT.SECONDARY }]}>
        {t('emptyState:emptyState.subtitle', { name: otherUserNickname })}
      </Text>
    </View>
  );

  /**
   * 에러 처리
   * @effect
   * @description 채팅 관련 에러를 사용자에게 알림
   */
  useEffect(() => {
    if (error) {
      Alert.alert(t('common:errors.error'), error, [
        {
          text: t('common:actions.confirm'),
          onPress: () => clearError(),
        },
      ]);
    }
  }, [error, clearError]);

  if (isLoading && !isInitialized) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text style={[styles.loadingText, { color: colors.TEXT.PRIMARY }]}>{t('common:loading.text')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.SURFACE} />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* 메시지 리스트 */}
        <FlatList
          ref={flatListRef}
          style={styles.messagesList}
          data={roomMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={renderListFooter}
          ListEmptyComponent={renderEmptyState}
          onScroll={handleScroll}
          onEndReached={loadMoreMessages}
          onEndReachedThreshold={0.1}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={{
            itemVisiblePercentThreshold: 80,
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            roomMessages.length === 0 ? styles.emptyContainer : styles.messagesContainer
          }
          inverted={false} // 최신 메시지가 아래에 오도록
        />

        {/* 메시지 입력 */}
        <MessageInput
          onSendMessage={handleSendMessage}
          onTypingStatusChange={handleTypingStatusChange}
          disabled={isLoading}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.SM,
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
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: SPACING.SM,
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
  loadingMore: {
    paddingVertical: SPACING.MD,
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: SPACING.SM,
    fontSize: FONT_SIZES.SM,
  },
});