/**
 * 그룹 채팅 목록 화면 (NativeWind v4 버전)
 *
 * @screen
 * @description 사용자가 참여 중인 그룹 채팅방 목록 및 공개 채팅방 탐색 화면
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
  Image,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '@/store/slices/authSlice';
import { useGroupStore } from '@/store/slices/groupSlice';
import { GroupChat } from '@/../shared/types';
import { formatDistanceToNow } from '@/utils/dateUtils';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { ServerConnectionError } from '@/components/ServerConnectionError';

interface ChatItemProps {
  chat: GroupChat;
  onPress: () => void;
}

const ChatItem = ({ chat, onPress }: ChatItemProps) => {
  const { t } = useAndroidSafeTranslation();
  const unreadCount = 0; // TODO: 실제 안읽은 메시지 수 계산

  return (
    <TouchableOpacity 
      className="flex-row items-center bg-white dark:bg-gray-800 py-4 px-4 border-b border-gray-200 dark:border-gray-700 active:opacity-70"
      onPress={onPress}
    >
      <Image 
        source={{ uri: chat.imageUrl || 'https://via.placeholder.com/56' }}
        className="w-14 h-14 rounded-full mr-4"
      />
      
      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <Text className="text-gray-900 dark:text-white text-base font-semibold flex-1" numberOfLines={1}>
            {chat.name}
          </Text>
          <Text className="text-gray-500 dark:text-gray-500 text-xs ml-3">
            <Icon name="people-outline" size={14} /> {t('groupchat:chat.memberCount', { count: chat.memberCount })}
          </Text>
        </View>
        
        <Text className="text-gray-600 dark:text-gray-400 text-sm mb-1" numberOfLines={1}>
          {chat.description || t('groupchat:chat.defaultDescription')}
        </Text>
        
        {chat.lastMessage && (
          <View className="flex-row items-center">
            <Text className="text-gray-500 dark:text-gray-500 text-sm flex-1" numberOfLines={1}>
              {chat.lastMessage.sender?.nickname}: {chat.lastMessage.content}
            </Text>
            <Text className="text-gray-500 dark:text-gray-500 text-xs ml-3">
              {formatDistanceToNow(chat.lastMessage.createdAt)}
            </Text>
          </View>
        )}
      </View>

      {unreadCount > 0 && (
        <View className="bg-blue-500 dark:bg-blue-600 rounded-full min-w-6 h-6 justify-center items-center px-1.5">
          <Text className="text-white text-xs font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

/**
 * 그룹 채팅 목록 화면 컴포넌트
 *
 * @component
 * @returns {JSX.Element} 그룹 채팅 목록 UI
 *
 * @description
 * 사용자가 참여 중인 그룹 채팅방 목록과 공개 채팅방 탐색 기능 제공
 * - 참여 중인 그룹 채팅방 목록 표시
 * - 마지막 메시지 및 시간 표시
 * - 안읽은 메시지 개수 표시
 * - 채팅방 검색 기능
 * - 공개 채팅방 탐색 버튼
 * - 새 그룹 채팅 생성 버튼 (FAB)
 * - Pull-to-refresh 지원
 * - 서버 연결 에러 처리
 *
 * @navigation
 * - From: ChatTab (하단 탭 네비게이션)
 * - To: GroupChat (그룹 채팅방), CreateGroupChat (채팅방 생성), PublicChatList (공개 채팅 목록)
 *
 * @example
 * ```tsx
 * navigation.navigate('GroupChatList');
 * ```
 *
 * @category Screen
 * @subcategory Chat
 */
export const GroupChatListScreen = () => {
  const navigation = useNavigation() as any;
  const { user } = useAuthStore();
  const { currentGroup } = useGroupStore();
  const { t } = useAndroidSafeTranslation();
  
  const [chats, setChats] = useState<GroupChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [serverConnectionError, setServerConnectionError] = useState(false);

  useEffect(() => {
    loadChats();
  }, [currentGroup]);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      setServerConnectionError(false);
      
      // API 호출로 실제 데이터 가져오기
      // TODO: groupChatApi가 구현되면 주석 해제
      // try {
      //   const response = await groupChatApi.getChats({
      //     groupId: currentGroup?.id,
      //   });
      //   setChats(response.data);
      // } catch (error) {
      //   console.error('Failed to load chats:', error);
      //   setServerConnectionError(true);
      //   setChats([]);
      // }
      
      // 현재는 빈 배열로 설정 (서버 API 없음)
      setChats([]);
      setServerConnectionError(true);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadChats();
  }, []);

  const handleChatPress = (chat: GroupChat) => {
    navigation.navigate('GroupChat', { chatId: chat.id });
  };

  const handleCreateChat = () => {
    navigation.navigate('CreateGroupChat');
  };

  const handleJoinPublicChat = () => {
    navigation.navigate('PublicChatList');
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 서버 연결 에러 시 에러 화면 표시
  if (serverConnectionError) {
    return (
      <ServerConnectionError 
        onRetry={() => {
          setServerConnectionError(false);
          loadChats();
        }}
        message="그룹 채팅 목록을 불러올 수 없습니다"
      />
    );
  }

  if (isLoading && !isRefreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" className="text-blue-500" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Search Bar */}
      <View className="flex-row items-center bg-white dark:bg-gray-800 mx-4 mt-4 mb-3 px-4 rounded-full h-11 shadow-sm">
        <Icon name="search-outline" size={20} className="text-gray-500 dark:text-gray-500" />
        <TextInput
          className="flex-1 ml-3 text-sm text-gray-900 dark:text-white"
          placeholder={t('groupchat:search.placeholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Quick Actions */}
      <View className="px-4 mb-3">
        <TouchableOpacity 
          className="flex-row items-center bg-blue-50 dark:bg-blue-900/20 py-3 px-4 rounded-full"
          onPress={handleJoinPublicChat}
        >
          <Icon name="globe-outline" size={20} className="text-blue-500 dark:text-blue-400" />
          <Text className="ml-2 text-sm text-blue-500 dark:text-blue-400 font-medium">
            {t('groupchat:actions.browsePublic')}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatItem chat={item} onPress={() => handleChatPress(item)} />
        )}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-24">
            <Icon name="chatbubbles-outline" size={60} className="text-gray-400 dark:text-gray-600" />
            <Text className="text-gray-600 dark:text-gray-400 text-base mt-4">{t('groupchat:empty.title')}</Text>
            <Text className="text-gray-500 dark:text-gray-500 text-sm mt-2 text-center px-8">
              {t('groupchat:empty.subtitle')}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
            colors={["#3B82F6"]}
          />
        }
        contentContainerStyle={filteredChats.length === 0 ? { flexGrow: 1 } : undefined}
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        className="absolute right-4 bottom-6 w-14 h-14 bg-teal-400 dark:bg-teal-500 rounded-full justify-center items-center shadow-lg"
        onPress={handleCreateChat}
      >
        <Icon name="add" size={28} className="text-white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};