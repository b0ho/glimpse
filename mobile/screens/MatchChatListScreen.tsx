import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
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

export const MatchChatListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { t } = useAndroidSafeTranslation();
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
      style={[styles.chatItem, { backgroundColor: colors.SURFACE }]}
      onPress={() => handleChatPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: colors.PRIMARY + '20' }]}>
        <Text style={[styles.avatarText, { color: colors.PRIMARY }]}>
          {item.otherUserNickname[0]}
        </Text>
      </View>
      
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={[styles.nickname, { color: colors.TEXT.PRIMARY }]}>
            {item.otherUserNickname}
          </Text>
          {item.isOnline && (
            <View style={[styles.onlineIndicator, { backgroundColor: '#4CAF50' }]} />
          )}
        </View>
        
        <Text style={[styles.lastMessage, { color: colors.TEXT.SECONDARY }]} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      
      <View style={styles.chatMeta}>
        <Text style={[styles.time, { color: colors.TEXT.TERTIARY }]}>
          {formatTime(item.lastMessageTime)}
        </Text>
        {item.unreadCount > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.ERROR }]}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="chatbubbles-outline" size={80} color={colors.TEXT.TERTIARY} />
      <Text style={[styles.emptyTitle, { color: colors.TEXT.PRIMARY }]}>
        {t('chat:emptyState.title')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.TEXT.SECONDARY }]}>
        {t('chat:emptyState.subtitle')}
      </Text>
      <View style={styles.emptyButtonContainer}>
        <TouchableOpacity
          style={[styles.goToSearchButton, { backgroundColor: colors.PRIMARY }]}
          onPress={() => navigation.navigate('Interest')}
        >
          <Icon name="heart-outline" size={20} color="#FFFFFF" />
          <Text style={styles.goToSearchText}>{t('chat:emptyState.findInterest')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.goToSearchButton, { backgroundColor: colors.SUCCESS }]}
          onPress={() => navigation.navigate('Groups')}
        >
          <Icon name="people-outline" size={20} color="#FFFFFF" />
          <Text style={styles.goToSearchText}>{t('chat:emptyState.findGroups')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      {/* 상단 헤더 - 프로필 화면과 동일한 스타일 */}
      <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
        <Text style={[styles.headerTitle, { color: colors.PRIMARY }]}>채팅</Text>
        <Text style={[styles.headerSubtitle, { color: colors.TEXT.PRIMARY }]}>
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
            colors={[colors.PRIMARY]}
          />
        }
        contentContainerStyle={chatRooms.length === 0 ? styles.emptyListContent : undefined}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nickname: {
    fontSize: 16,
    fontWeight: '600',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  lastMessage: {
    fontSize: 14,
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  time: {
    fontSize: 12,
    marginBottom: 4,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButtonContainer: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  goToSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  goToSearchText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyListContent: {
    flexGrow: 1,
  },
});