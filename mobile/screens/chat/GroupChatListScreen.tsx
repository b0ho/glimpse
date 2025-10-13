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
import { GroupChat } from '@/shared/types';
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
     
      onPress={onPress}
    >
      <Image 
        source={{ uri: chat.imageUrl || 'https://via.placeholder.com/56' }}
       
      />
      
      <View>
        <View>
          <Text numberOfLines={1}>
            {chat.name}
          </Text>
          <Text>
            <Icon name="people-outline" size={14} /> {t('groupchat:chat.memberCount', { count: chat.memberCount })}
          </Text>
        </View>
        
        <Text numberOfLines={1}>
          {chat.description || t('groupchat:chat.defaultDescription')}
        </Text>
        
        {chat.lastMessage && (
          <View>
            <Text numberOfLines={1}>
              {chat.lastMessage.sender?.nickname}: {chat.lastMessage.content}
            </Text>
            <Text>
              {formatDistanceToNow(chat.lastMessage.createdAt)}
            </Text>
          </View>
        )}
      </View>

      {unreadCount > 0 && (
        <View>
          <Text>
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
      <View>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView>
      {/* Search Bar */}
      <View>
        <Icon name="search-outline" size={20} />
        <TextInput
         
          placeholder={t('groupchat:search.placeholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Quick Actions */}
      <View>
        <TouchableOpacity 
         
          onPress={handleJoinPublicChat}
        >
          <Icon name="globe-outline" size={20} />
          <Text>
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
          <View>
            <Icon name="chatbubbles-outline" size={60} />
            <Text>{t('groupchat:empty.title')}</Text>
            <Text>
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
       
        onPress={handleCreateChat}
      >
        <Icon name="add" size={28} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};