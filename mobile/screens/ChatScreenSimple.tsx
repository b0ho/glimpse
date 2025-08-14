/**
 * 간단한 채팅 화면 - 무한 루프 없이 테스트용
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useChatStore } from '@/store/slices/chatSlice';
import { useAuthStore } from '@/store/slices/authSlice';
import { Message } from '@/types';
import { SPACING, FONT_SIZES } from '@/utils/constants';
import { generateDummyChatMessages } from '@/utils/mockData';
import { useTheme } from '@/hooks/useTheme';

type ChatScreenRouteProp = {
  params: {
    roomId: string;
    matchId: string;
    otherUserNickname: string;
  };
};

export const ChatScreenSimple = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation();
  const { roomId, matchId, otherUserNickname } = route.params;
  const { t } = useTranslation('chat');
  const { colors } = useTheme();

  // Local states
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 메시지를 AsyncStorage에 저장하는 함수
  const saveMessages = async (messagesToSave: Message[]) => {
    try {
      const key = `chat_messages_${matchId}`;
      await AsyncStorage.setItem(key, JSON.stringify(messagesToSave));
      console.log('[ChatScreenSimple] 메시지 저장됨:', messagesToSave.length, '개');
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  };

  // AsyncStorage에서 메시지를 불러오는 함수
  const loadStoredMessages = async (): Promise<Message[]> => {
    try {
      const key = `chat_messages_${matchId}`;
      const storedData = await AsyncStorage.getItem(key);
      if (storedData) {
        const parsedMessages = JSON.parse(storedData);
        console.log('[ChatScreenSimple] 저장된 메시지 불러옴:', parsedMessages.length, '개');
        return parsedMessages;
      }
      return [];
    } catch (error) {
      console.error('Failed to load stored messages:', error);
      return [];
    }
  };

  // Load mock messages and stored messages
  useEffect(() => {
    const loadMockMessages = async () => {
      try {
        setIsLoading(true);
        
        // 먼저 저장된 메시지가 있는지 확인
        const storedMessages = await loadStoredMessages();
        
        if (storedMessages.length > 0) {
          // 저장된 메시지가 있으면 사용
          setMessages(storedMessages);
        } else {
          // 저장된 메시지가 없으면 mock 메시지 생성
          await new Promise(resolve => setTimeout(resolve, 1000));
          const mockMessages = generateDummyChatMessages(matchId);
          setMessages(mockMessages);
          // 처음 생성된 mock 메시지도 저장
          await saveMessages(mockMessages);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMockMessages();
  }, [matchId]);

  // Handle leave chat
  const handleLeaveChat = () => {
    Alert.alert(
      '채팅 나가기',
      '이 채팅방을 나가시겠습니까?\n대화 내용이 모두 삭제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '나가기',
          style: 'destructive',
          onPress: async () => {
            try {
              // 메시지 삭제
              const key = `chat_messages_${matchId}`;
              await AsyncStorage.removeItem(key);
              console.log('[ChatScreenSimple] 채팅 메시지 삭제 완료');
              
              // 채팅방 목록에서도 제거
              const roomsStr = await AsyncStorage.getItem('chat-rooms');
              if (roomsStr) {
                const rooms = JSON.parse(roomsStr);
                const updatedRooms = rooms.filter((room: any) => room.matchId !== matchId);
                await AsyncStorage.setItem('chat-rooms', JSON.stringify(updatedRooms));
                console.log('[ChatScreenSimple] 채팅방 목록에서 제거 완료');
              }
              
              // 이전 화면으로 돌아가기
              navigation.goBack();
            } catch (error) {
              console.error('[ChatScreenSimple] 채팅 나가기 실패:', error);
              Alert.alert('오류', '채팅 나가기에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  // Set navigation title with leave chat option
  useEffect(() => {
    navigation.setOptions({
      title: otherUserNickname,
      headerStyle: {
        backgroundColor: colors.SURFACE,
      },
      headerTintColor: colors.PRIMARY,
      headerRight: () => (
        <TouchableOpacity
          onPress={handleLeaveChat}
          style={{ marginRight: 15 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="exit-outline" size={24} color={colors.ERROR} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, otherUserNickname, colors]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      matchId: matchId,
      senderId: 'current_user',
      content: inputText.trim(),
      type: 'TEXT',
      isRead: true,
      isEncrypted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputText('');
    
    // 새 메시지를 AsyncStorage에 저장
    await saveMessages(updatedMessages);
    console.log('[ChatScreenSimple] 새 메시지 전송 및 저장:', newMessage.content);
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === 'current_user';
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage 
            ? { backgroundColor: colors.PRIMARY, borderBottomRightRadius: 4 }
            : { backgroundColor: colors.SURFACE, borderBottomLeftRadius: 4 }
        ]}>
          <Text style={[
            styles.messageText,
            { color: isOwnMessage ? colors.TEXT.WHITE : colors.TEXT.PRIMARY }
          ]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text style={[styles.loadingText, { color: colors.TEXT.SECONDARY }]}>채팅을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <FlatList
        style={styles.messagesList}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContainer}
      />

      <View style={[styles.inputContainer, { backgroundColor: colors.SURFACE }]}>
        <TextInput
          style={[
            styles.textInput,
            { 
              borderColor: colors.BORDER,
              backgroundColor: colors.BACKGROUND,
              color: colors.TEXT.PRIMARY 
            }
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="메시지를 입력하세요..."
          placeholderTextColor={colors.TEXT.SECONDARY}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: inputText.trim() ? colors.PRIMARY : colors.TEXT.SECONDARY }
          ]}
          onPress={handleSendMessage}
          disabled={!inputText.trim()}
        >
          <Text style={[styles.sendButtonText, { color: colors.TEXT.WHITE }]}>전송</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

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
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
  },
  messageContainer: {
    marginVertical: SPACING.XS,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: SPACING.MD,
    borderRadius: 18,
  },
  messageText: {
    fontSize: FONT_SIZES.MD,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: SPACING.MD,
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    marginRight: SPACING.SM,
    fontSize: FONT_SIZES.MD,
  },
  sendButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
});