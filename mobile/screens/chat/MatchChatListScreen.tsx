/**
 * 매칭 채팅 목록 화면 (NativeWind v4 버전)
 *
 * @screen
 * @description 매칭된 사용자와의 1:1 채팅방 목록 화면. 최근 대화 순으로 정렬
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';

interface ChatRoom {
  id: string;
  matchId: string;
  otherUserNickname: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

/**
 * 매칭 채팅 목록 화면 컴포넌트
 *
 * @component
 * @returns {JSX.Element} 매칭 채팅 목록 UI
 *
 * @description
 * 매칭이 성사된 사용자와의 1:1 채팅방 목록 화면
 * - AsyncStorage 기반 채팅방 로드
 * - 마지막 메시지 시간 순 정렬
 * - 안읽은 메시지 개수 표시
 * - 온라인 상태 표시
 * - 상대 시간 표시 (오늘/어제/N일 전)
 * - Pull-to-refresh 지원
 * - 빈 상태 안내 (관심사/그룹 탐색 유도)
 * - 프로필 화면과 동일한 헤더 스타일
 *
 * @navigation
 * - From: ChatTab (하단 탭 네비게이션)
 * - To: Chat (1:1 채팅방), Interest (관심사 탐색), Groups (그룹 탐색)
 *
 * @example
 * ```tsx
 * navigation.navigate('MatchChatList');
 * ```
 *
 * @category Screen
 * @subcategory Chat
 */
export const MatchChatListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useAndroidSafeTranslation(['chat', 'common']);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadChatRooms();
  }, []);

  const loadChatRooms = async () => {
    try {
      setIsLoading(true);
      
      // AsyncStorage에서 채팅방 목록 가져오기
      const roomsStr = await AsyncStorage.getItem('chat-rooms');
      const rooms = roomsStr ? JSON.parse(roomsStr) : [];
      
      // 각 채팅방의 마지막 메시지 업데이트
      const updatedRooms = await Promise.all(rooms.map(async (room: ChatRoom) => {
        const messagesKey = `chat_messages_${room.matchId}`;
        const messagesStr = await AsyncStorage.getItem(messagesKey);
        
        if (messagesStr) {
          const messages = JSON.parse(messagesStr);
          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            return {
              ...room,
              lastMessage: lastMessage.content,
              lastMessageTime: lastMessage.createdAt,
            };
          }
        }
        
        return room;
      }));
      
      // 최신 메시지 순으로 정렬
      updatedRooms.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime).getTime();
        const timeB = new Date(b.lastMessageTime).getTime();
        return timeB - timeA;
      });
      
      setChatRooms(updatedRooms);
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadChatRooms();
  }, []);

  const handleChatPress = (room: ChatRoom) => {
    navigation.navigate('Chat', {
      roomId: room.id,
      matchId: room.matchId,
      otherUserNickname: room.otherUserNickname,
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else if (days === 1) {
      return t('common:time.yesterday');
    } else if (days < 7) {
      return t('common:time.daysAgo', { count: days });
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  };

  const renderChatItem = ({ item }: { item: ChatRoom }) => (
    <TouchableOpacity
      className="flex-row items-center py-4 px-5 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 active:opacity-70"
      onPress={() => handleChatPress(item)}
    >
      <View className="w-12.5 h-12.5 rounded-full bg-blue-100 dark:bg-blue-900/30 justify-center items-center mr-4">
        <Text className="text-blue-500 dark:text-blue-400 text-lg font-bold">
          {item.otherUserNickname[0]}
        </Text>
      </View>
      
      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <Text className="text-gray-900 dark:text-white text-base font-semibold">
            {item.otherUserNickname}
          </Text>
          {item.isOnline && (
            <View className="w-2 h-2 rounded-full bg-green-500 ml-2" />
          )}
        </View>
        
        <Text className="text-gray-600 dark:text-gray-400 text-sm" numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      
      <View className="items-end">
        <Text className="text-gray-500 dark:text-gray-500 text-xs mb-1">
          {formatTime(item.lastMessageTime)}
        </Text>
        {item.unreadCount > 0 && (
          <View className="min-w-5 h-5 rounded-full bg-red-500 dark:bg-red-600 justify-center items-center px-1.5">
            <Text className="text-white text-xs font-bold">{item.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-10 py-20">
      <Icon name="chatbubbles-outline" size={80} className="text-gray-400 dark:text-gray-600" />
      <Text className="text-gray-900 dark:text-white text-xl font-bold mt-5">
        {t('chat:emptyState.title')}
      </Text>
      <Text className="text-gray-600 dark:text-gray-400 text-sm text-center mt-2 leading-5">
        {t('chat:emptyState.subtitle')}
      </Text>
      <View className="flex-row mt-6 gap-3">
        <TouchableOpacity
          className="flex-row items-center bg-blue-500 dark:bg-blue-600 px-5 py-3 rounded-full gap-2"
          onPress={() => navigation.navigate('Interest')}
        >
          <Icon name="heart-outline" size={20} className="text-white" />
          <Text className="text-white text-sm font-semibold">{t('chat:emptyState.findInterest')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center bg-green-500 dark:bg-green-600 px-5 py-3 rounded-full gap-2"
          onPress={() => navigation.navigate('Groups')}
        >
          <Icon name="people-outline" size={20} className="text-white" />
          <Text className="text-white text-sm font-semibold">{t('chat:emptyState.findGroups')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" className="text-blue-500" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      {/* 상단 헤더 - 프로필 화면과 동일한 스타일 */}
      <View className="px-6 py-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <Text className="text-blue-500 dark:text-blue-400 text-2xl font-bold mb-1">채팅</Text>
        <Text className="text-gray-900 dark:text-white text-base">
          매칭된 상대와 대화를 나눠보세요
        </Text>
      </View>

      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
            colors={["#3B82F6"]}
          />
        }
        contentContainerStyle={chatRooms.length === 0 ? { flexGrow: 1 } : undefined}
      />
    </SafeAreaView>
  );
};