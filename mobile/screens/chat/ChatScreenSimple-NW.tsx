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

  // Server-only approach: No localStorage for messages
  // Messages must always be fetched from the server

  // Load messages from API only - no localStorage fallback
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        
        // API에서 실제 메시지 가져오기 (서버 연동 필수)
        const apiMessages = await chatService.getMessages(matchId);
        if (apiMessages && apiMessages.length > 0) {
          setMessages(apiMessages);
          console.log('[ChatScreenSimple] 서버에서 메시지 로드 성공:', apiMessages.length, '개');
        } else {
          setMessages([]);
          console.log('[ChatScreenSimple] 메시지가 없습니다');
        }
      } catch (error) {
        console.error('[ChatScreenSimple] 서버 메시지 로드 실패:', error);
        // Show error to user instead of using localStorage
        Alert.alert(
          t('errors.serverError'),
          t('errors.loadMessagesFailed'),
          [{ text: t('common:ok') }]
        );
        setMessages([]);
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
              // Notify server about leaving the chat
              await chatService.leaveChat(matchId);
              console.log('[ChatScreenSimple] 서버에 채팅 나가기 알림');
              
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

    try {
      // Send message to server
      await chatService.sendMessage(matchId, newMessage);
      
      // Update UI optimistically
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      setInputText('');
      console.log('[ChatScreenSimple] 메시지 서버 전송 성공:', newMessage.content);
    } catch (error) {
      console.error('[ChatScreenSimple] 메시지 전송 실패:', error);
      Alert.alert(
        t('errors.sendFailed'),
        t('errors.messageSendFailed'),
        [{ text: t('common:ok') }]
      );
    }
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