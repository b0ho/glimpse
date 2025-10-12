/**
 * 1:1 실시간 채팅 화면 (NativeWind v4 버전)
 *
 * @screen
 * @description 매칭된 사용자와의 실시간 채팅 화면. 로맨틱한 디자인과 부드러운 애니메이션으로 친밀감 조성
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useChatStore, chatSelectors } from '@/store/slices/chatSlice';
import { useAuthStore } from '@/store/slices/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageInput } from '@/components/chat/MessageInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { useCall } from '@/providers/CallProvider';
import { Message } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '@/lib/utils';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width: screenWidth } = Dimensions.get('window');

type ChatScreenRouteProp = RouteProp<{
  Chat: {
    roomId: string;
    matchId: string;
    otherUserNickname: string;
  };
}, 'Chat'>;

/**
 * 1:1 채팅 화면 컴포넌트
 *
 * @component
 * @returns {JSX.Element} 실시간 채팅 UI
 *
 * @description
 * 매칭된 사용자와의 1:1 실시간 채팅 기능 제공
 * - Socket.IO 기반 실시간 메시지 송수신
 * - 입력 중 상태 표시 (Typing Indicator)
 * - 메시지 읽음 처리 및 상태 표시
 * - 음성/영상 통화 시작 버튼
 * - 로맨틱한 그라디언트 메시지 버블
 * - 부드러운 메시지 입장/퇴장 애니메이션
 * - 하트 이펙트 애니메이션
 * - 무한 스크롤 페이지네이션
 * - 키보드 회피 처리
 *
 * @navigation
 * - From: MatchChatListScreen (채팅 목록에서 특정 채팅방 선택)
 * - To: CallScreen (음성/영상 통화 시작)
 *
 * @example
 * ```tsx
 * navigation.navigate('Chat', {
 *   roomId: 'room-123',
 *   matchId: 'match-456',
 *   otherUserNickname: '민지'
 * });
 * ```
 *
 * @category Screen
 * @subcategory Chat
 */
export const ChatScreen = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation();
  const { roomId, matchId, otherUserNickname } = route.params;
  const { initiateCall, isInCall } = useCall();
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation(['chat', 'common']);

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

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const heartAnim = useRef(new Animated.Value(0)).current;
  const messageAnimations = useRef<Map<string, Animated.Value>>(new Map()).current;

  // Selectors
  const roomMessages = useChatStore(chatSelectors.getMessages(roomId));
  const typingUsers = useChatStore(chatSelectors.getTypingUsers(roomId));
  const isOtherUserTyping = typingUsers.some(user => user.userId !== authStore.user?.id);

  // Entry animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Heart beat animation for new messages
  const startHeartAnimation = () => {
    Animated.sequence([
      Animated.timing(heartAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(heartAnim, {
        toValue: 0,
        duration: 300,
        delay: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Chat initialization
  useEffect(() => {
    let mounted = true;
    
    const initChat = async () => {
      if (!authStore.user?.id || !authStore.token) {
        Alert.alert(t('chat:errors.error'), t('chat:errors.loginRequired'));
        navigation.goBack();
        return;
      }

      if (isInitialized || !mounted) return;

      try {
        await initializeChat(authStore.user.id, authStore.token);
        if (mounted) {
          setIsInitialized(true);
          setActiveRoom(roomId);
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

    return () => {
      mounted = false;
      setActiveRoom(null);
    };
  }, [roomId]);

  // Navigation header
  useEffect(() => {
    navigation.setOptions({
      header: () => (
        <SafeAreaView className="border-b bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <View className="flex-row items-center px-4 py-3">
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-3"
            >
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={colors.PRIMARY} 
              />
            </TouchableOpacity>
            
            {/* User Info */}
            <View className="flex-1 flex-row items-center">
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
              >
                <Text className="text-white font-bold text-lg">
                  {otherUserNickname.charAt(0)}
                </Text>
              </LinearGradient>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                  {otherUserNickname}
                </Text>
                {isOtherUserTyping && (
                  <Text className="text-sm text-primary-500">
                    입력 중...
                  </Text>
                )}
              </View>
            </View>
            
            {/* Call Buttons */}
            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={() => handleCall('audio')}
                disabled={isInCall}
                className={cn(
                  "w-10 h-10 rounded-full items-center justify-center",
                  isInCall ? "bg-gray-300" : "bg-primary-100 dark:bg-primary-900/20"
                )}
              >
                <Ionicons 
                  name="call" 
                  size={20} 
                  color={isInCall ? colors.TEXT.SECONDARY : colors.PRIMARY} 
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleCall('video')}
                disabled={isInCall}
                className={cn(
                  "w-10 h-10 rounded-full items-center justify-center",
                  isInCall ? "bg-gray-300" : "bg-secondary-100 dark:bg-secondary-900/20"
                )}
              >
                <Ionicons 
                  name="videocam" 
                  size={20} 
                  color={isInCall ? colors.TEXT.SECONDARY : colors.SECONDARY} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      ),
    });
  }, [navigation, otherUserNickname, isInCall, isOtherUserTyping, colors]);

  const handleCall = useCallback((callType: 'video' | 'audio') => {
    const otherUserId = matchId;
    initiateCall(otherUserId, otherUserNickname, callType);
  }, [matchId, otherUserNickname, initiateCall]);

  const handleSendMessage = useCallback(async (content: string, type?: 'TEXT' | 'IMAGE' | 'VOICE' | 'LOCATION' | 'STORY_REPLY') => {
    try {
      await sendMessage(roomId, content, type);
      startHeartAnimation();
      
      setTimeout(() => {
        if (isNearBottom.current) {
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      }, 100);
    } catch (error) {
      console.error('Send message failed:', error);
    }
  }, [roomId, sendMessage]);

  const handleTypingStatusChange = useCallback((isTyping: boolean) => {
    setTypingStatus(roomId, isTyping);
  }, [roomId, setTypingStatus]);

  const handleMessageLongPress = useCallback((message: Message) => {
    Alert.alert(
      t('chat:errors.messageOptions'),
      t('chat:errors.copyConfirm'),
      [
        { text: t('chat:errors.cancel'), style: 'cancel' },
        {
          text: t('chat:errors.copy'),
          onPress: () => {
            console.log('Copy message:', message.content);
            Alert.alert(t('common:buttons.done'), t('chat:errors.copySuccess'));
          },
        },
      ]
    );
  }, [t]);

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

  const handleScroll = useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    isNearBottom.current = layoutMeasurement.height + contentOffset.y >= 
      contentSize.height - paddingToBottom;
  }, []);

  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    viewableItems.forEach((item: any) => {
      const message: Message = item.item;
      if (!message.isRead && message.senderId !== authStore.user?.id) {
        markMessageAsRead(message.id, roomId);
      }
    });
  }, [authStore.user?.id, roomId, markMessageAsRead]);

  const getMessageAnimation = (messageId: string) => {
    if (!messageAnimations.has(messageId)) {
      messageAnimations.set(messageId, new Animated.Value(0));
      Animated.timing(messageAnimations.get(messageId)!, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    return messageAnimations.get(messageId)!;
  };

  const renderMessageItem = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.senderId === authStore.user?.id;
    const previousMessage = index > 0 ? roomMessages[index - 1] : null;
    const showAvatar = !isOwnMessage && (
      !previousMessage || 
      previousMessage.senderId !== item.senderId ||
      new Date(item.createdAt).getTime() - new Date(previousMessage.createdAt).getTime() > 300000
    );
    
    const messageAnim = getMessageAnimation(item.id);
    const translateY = messageAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [30, 0],
    });

    return (
      <Animated.View
        style={{
          opacity: messageAnim,
          transform: [{ translateY }],
        }}
        className={cn(
          "px-4 mb-2",
          isOwnMessage ? "items-end" : "items-start"
        )}
      >
        <View className={cn(
          "flex-row items-end max-w-[80%]",
          isOwnMessage && "flex-row-reverse"
        )}>
          {showAvatar && !isOwnMessage && (
            <View className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-red-500 items-center justify-center mr-2">
              <Text className="text-white text-xs font-bold">
                {otherUserNickname.charAt(0)}
              </Text>
            </View>
          )}
          
          <View className={cn(
            "px-4 py-2 rounded-2xl",
            isOwnMessage 
              ? "bg-gradient-to-r from-primary-500 to-primary-400" 
              : "bg-gray-100 dark:bg-gray-800",
            isOwnMessage ? "rounded-br-sm" : "rounded-bl-sm"
          )}>
            {isOwnMessage ? (
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="px-4 py-2 rounded-2xl rounded-br-sm"
              >
                <Text className="text-white">{item.content}</Text>
              </LinearGradient>
            ) : (
              <Text className="text-gray-900 dark:text-white">
                {item.content}
              </Text>
            )}
          </View>
        </View>
        
        {item.isRead && isOwnMessage && (
          <Text className="text-xs text-gray-500 mt-1 mr-2">
            읽음
          </Text>
        )}
      </Animated.View>
    );
  };

  const renderListHeader = () => {
    if (!isLoadingMore) return null;

    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color={colors.PRIMARY} />
        <Text className="text-sm mt-2 text-gray-600 dark:text-gray-400">
          {t('chat:loading.previousMessages')}
        </Text>
      </View>
    );
  };

  const renderListFooter = () => {
    if (!isOtherUserTyping) return null;

    return (
      <View className="px-4 py-2">
        <View className="flex-row items-center">
          <View className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-2xl rounded-bl-sm">
            <View className="flex-row space-x-1">
              <Animated.View
                style={{
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 1, 0.3],
                  }),
                }}
                className="w-2 h-2 rounded-full bg-gray-500"
              />
              <Animated.View
                style={{
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 1, 0.3],
                  }),
                }}
                className="w-2 h-2 rounded-full bg-gray-500"
              />
              <Animated.View
                style={{
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 1, 0.3],
                  }),
                }}
                className="w-2 h-2 rounded-full bg-gray-500"
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8">
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: fadeAnim }],
        }}
        className="mb-6"
      >
        <Text className="text-6xl">💌</Text>
      </Animated.View>
      <Text className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
        {t('chat:emptyState.title')}
      </Text>
      <Text className="text-center text-gray-600 dark:text-gray-400">
        {t('chat:emptyState.subtitle', { name: otherUserNickname })}
      </Text>
    </View>
  );

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
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
        <View className="flex-1 items-center justify-center">
          <Animated.View
            style={{
              transform: [{ scale: heartAnim }],
            }}
            className="mb-4"
          >
            <Ionicons name="heart" size={48} color={colors.PRIMARY} />
          </Animated.View>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text className="mt-4 font-medium text-gray-600 dark:text-gray-400">
            {t('common:loading.text')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <StatusBar barStyle="dark-content" />
      
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Floating Heart Animation */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginLeft: -50,
            marginTop: -50,
            opacity: heartAnim,
            transform: [
              { scale: heartAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 2],
              })},
            ],
            zIndex: 999,
          }}
        >
          <Ionicons name="heart" size={100} color="#FF6B6B33" />
        </Animated.View>
        
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          className="flex-1"
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
            roomMessages.length === 0 ? { flexGrow: 1 } : { paddingVertical: 8 }
          }
          inverted={false}
        />

        {/* Message Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          onTypingStatusChange={handleTypingStatusChange}
          disabled={isLoading}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};