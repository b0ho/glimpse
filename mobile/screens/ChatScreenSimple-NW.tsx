/**
 * 간단한 채팅 화면 - NativeWind 버전
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useChatStore } from '@/store/slices/chatSlice';
import { useAuthStore } from '@/store/slices/authSlice';
import { Message } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { chatService } from '@/services/chat/chatService';

import type { RouteProp } from '@react-navigation/native';

type RootStackParamList = {
  ChatScreenSimple: {
    roomId: string;
    matchId: string;
    otherUserNickname: string;
  };
};

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'ChatScreenSimple'>;

export const ChatScreenSimple = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation();
  const { roomId, matchId, otherUserNickname } = route.params;
  const { t } = useAndroidSafeTranslation('chat');
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

  // Load messages from API or stored messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        
        // 먼저 저장된 메시지가 있는지 확인
        const storedMessages = await loadStoredMessages();
        
        if (storedMessages.length > 0) {
          // 저장된 메시지가 있으면 사용
          setMessages(storedMessages);
        }
        
        // API에서 실제 메시지 가져오기
        try {
          const apiMessages = await chatService.getMessages(matchId);
          if (apiMessages && apiMessages.length > 0) {
            setMessages(apiMessages);
            await saveMessages(apiMessages);
          }
        } catch (apiError) {
          console.log('[ChatScreenSimple] API 호출 실패, 저장된 메시지 사용:', apiError);
          // API 실패 시 저장된 메시지 유지
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [matchId]);

  // Handle leave chat
  const handleLeaveChat = () => {
    Alert.alert(
      t('leave.title'),
      t('leave.confirmMessage'),
      [
        { text: t('leave.cancel'), style: 'cancel' },
        {
          text: t('leave.confirm'),
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
              Alert.alert(t('errors.error'), t('leave.error'));
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
          className="mr-4 p-2"
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
      <View className={`my-1 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        <View 
          className={`max-w-[80%] px-4 py-3 rounded-2xl ${
            isOwnMessage 
              ? 'bg-red-500 rounded-br-sm' 
              : 'bg-white dark:bg-gray-800 rounded-bl-sm'
          }`}
        >
          <Text 
            className={`text-base leading-5 ${
              isOwnMessage ? 'text-white' : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text className="mt-4 text-base text-gray-500 dark:text-gray-400">
            {t('loading.text')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <FlatList
        className="flex-1"
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 16 }}
      />

      <View className="flex-row p-4 items-end bg-white dark:bg-gray-800">
        <TextInput
          className="flex-1 min-h-[40px] max-h-[100px] border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-3xl px-4 py-2 mr-2 text-base"
          value={inputText}
          onChangeText={setInputText}
          placeholder={t('input.placeholder')}
          placeholderTextColor={colors.TEXT.SECONDARY}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          className={`px-4 py-2 rounded-3xl justify-center items-center ${
            inputText.trim() ? 'bg-red-500' : 'bg-gray-400'
          }`}
          onPress={handleSendMessage}
          disabled={!inputText.trim()}
        >
          <Text className="text-sm font-semibold text-white">
            {t('messageInput.send')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};