/**
 * 채팅 화면
 * 실시간 메시징 및 채팅 기능 제공
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
import { useChatStore, chatSelectors } from '@/store/slices/chatSlice';
import { useAuthStore } from '@/store/slices/authSlice';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageInput } from '@/components/chat/MessageInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { CallButton } from '@/components/call/CallButton';
import { useCall } from '@/providers/CallProvider';
import { Message } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

type ChatScreenRouteProp = RouteProp<{
  Chat: {
    roomId: string;
    matchId: string;
    otherUserNickname: string;
  };
}, 'Chat'>;

export const ChatScreen: React.FC = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation();
  const { roomId, matchId, otherUserNickname } = route.params;
  const { initiateCall, isInCall } = useCall();

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

  // 초기화
  useEffect(() => {
    const initChat = async () => {
      if (!authStore.user?.id || !authStore.token) {
        Alert.alert('오류', '로그인이 필요합니다.');
        navigation.goBack();
        return;
      }

      try {
        // 채팅 시스템 초기화
        if (!isInitialized) {
          await initializeChat(authStore.user.id, authStore.token);
          setIsInitialized(true);
        }

        // 채팅방 활성화
        setActiveRoom(roomId);
        
        // 메시지 로드
        await loadMessages(roomId);
      } catch (error) {
        console.error('Chat initialization failed:', error);
        Alert.alert('오류', '채팅방을 불러오는데 실패했습니다.');
      }
    };

    initChat();

    // 화면을 벗어날 때 채팅방에서 나가기
    return () => {
      if (activeRoomId === roomId) {
        setActiveRoom(null);
      }
    };
  }, [roomId, authStore.user?.id, authStore.token, isInitialized, activeRoomId, initializeChat, loadMessages, navigation, setActiveRoom]);

  // 네비게이션 헤더 설정
  useEffect(() => {
    navigation.setOptions({
      title: otherUserNickname,
      headerStyle: {
        backgroundColor: COLORS.SURFACE,
      },
      headerTintColor: COLORS.PRIMARY,
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

  // 통화 시작 핸들러
  const handleCall = useCallback((callType: 'video' | 'audio') => {
    // matchId에서 상대방 userId 추출 (실제로는 API에서 가져와야 함)
    const otherUserId = matchId; // 임시로 matchId 사용
    initiateCall(otherUserId, otherUserNickname, callType);
  }, [matchId, otherUserNickname, initiateCall]);

  // 메시지 전송 핸들러
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

  // 타이핑 상태 변경 핸들러
  const handleTypingStatusChange = useCallback((isTyping: boolean) => {
    setTypingStatus(roomId, isTyping);
  }, [roomId, setTypingStatus]);

  // 메시지 길게 누르기 핸들러
  const handleMessageLongPress = useCallback((message: Message) => {
    Alert.alert(
      '메시지 옵션',
      '이 메시지를 복사하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '복사',
          onPress: () => {
            // 실제 구현에서는 Clipboard API 사용
            console.log('Copy message:', message.content);
            Alert.alert('완료', '메시지가 복사되었습니다.');
          },
        },
      ]
    );
  }, []);

  // 더 많은 메시지 로드
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

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback((event: {nativeEvent: {layoutMeasurement: {height: number}, contentOffset: {y: number}, contentSize: {height: number}}}) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    isNearBottom.current = layoutMeasurement.height + contentOffset.y >= 
      contentSize.height - paddingToBottom;
  }, []);

  // 메시지 읽음 표시
  const handleViewableItemsChanged = useCallback(({ viewableItems }: {viewableItems: Array<{item: Message}>}) => {
    viewableItems.forEach((item: {item: Message}) => {
      const message: Message = item.item;
      if (!message.isRead && message.senderId !== authStore.user?.id) {
        markMessageAsRead(message.id, roomId);
      }
    });
  }, [authStore.user?.id, roomId, markMessageAsRead]);

  // 메시지 아이템 렌더링
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

  // 리스트 헤더 (더 불러오기)
  const renderListHeader = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={COLORS.PRIMARY} />
        <Text style={styles.loadingMoreText}>이전 메시지를 불러오는 중...</Text>
      </View>
    );
  };

  // 리스트 푸터 (타이핑 인디케이터)
  const renderListFooter = () => {
    return (
      <TypingIndicator 
        isTyping={isOtherUserTyping}
        userName={otherUserNickname}
      />
    );
  };

  // 빈 상태 렌더링
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateEmoji}>💬</Text>
      <Text style={styles.emptyStateTitle}>대화를 시작해보세요!</Text>
      <Text style={styles.emptyStateSubtitle}>
        {otherUserNickname}님과 첫 메시지를 나눠보세요.{'\n'}
        서로에 대해 알아가는 시간을 가져보세요.
      </Text>
    </View>
  );

  // 에러 처리
  useEffect(() => {
    if (error) {
      Alert.alert('오류', error, [
        {
          text: '확인',
          onPress: () => clearError(),
        },
      ]);
    }
  }, [error, clearError]);

  if (isLoading && !isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>채팅방을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.SURFACE} />
      
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
    backgroundColor: COLORS.BACKGROUND,
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
    color: COLORS.TEXT.SECONDARY,
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
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
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
    color: COLORS.TEXT.SECONDARY,
  },
});