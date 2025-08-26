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
  Image,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '@/store/slices/authSlice';
import { useGroupStore } from '@/store/slices/groupSlice';
import { GroupChat } from '../../shared/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { formatDistanceToNow } from '@/utils/dateUtils';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';

interface ChatItemProps {
  chat: GroupChat;
  onPress: () => void;
}

const ChatItem = ({ chat, onPress }: ChatItemProps) => {
  const { t } = useAndroidSafeTranslation();
  const unreadCount = 0; // TODO: 실제 안읽은 메시지 수 계산

  return (
    <TouchableOpacity style={styles.chatItem} onPress={onPress} activeOpacity={0.7}>
      <Image 
        source={{ uri: chat.imageUrl || 'https://via.placeholder.com/56' }}
        style={styles.chatAvatar}
      />
      
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName} numberOfLines={1}>{chat.name}</Text>
          <Text style={styles.memberCount}>
            <Icon name="people-outline" size={14} /> {t('groupchat:chat.memberCount', { count: chat.memberCount })}
          </Text>
        </View>
        
        <Text style={styles.chatDescription} numberOfLines={1}>
          {chat.description || t('groupchat:chat.defaultDescription')}
        </Text>
        
        {chat.lastMessage && (
          <View style={styles.lastMessageRow}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {chat.lastMessage.sender?.nickname}: {chat.lastMessage.content}
            </Text>
            <Text style={styles.lastMessageTime}>
              {formatDistanceToNow(chat.lastMessage.createdAt)}
            </Text>
          </View>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{unreadCount > 99 ? t('groupchat:chat.unreadBadge', { count: 99 }) : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const GroupChatListScreen = () => {
  const navigation = useNavigation() as any;
  const { user } = useAuthStore();
  const { currentGroup } = useGroupStore();
  const { t } = useAndroidSafeTranslation();
  
  const [chats, setChats] = useState<GroupChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadChats();
  }, [currentGroup]);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      // TODO: API 호출로 실제 데이터 가져오기
      // const response = await groupChatApi.getChats({
      //   groupId: currentGroup?.id,
      // });
      
      // 더미 데이터
      const dummyChats: GroupChat[] = [
        {
          id: '1',
          groupId: currentGroup?.id || 'group1',
          name: t('groupchat:dummyData.freeChat'),
          description: t('groupchat:dummyData.freeChatDesc'),
          imageUrl: 'https://via.placeholder.com/100',
          maxMembers: 50,
          memberCount: 23,
          isPublic: true,
          lastMessageAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          lastMessage: {
            id: 'msg1',
            chatId: '1',
            senderId: 'user1',
            content: t('groupchat:dummyData.messages.greeting'),
            type: 'TEXT',
            isEncrypted: true,
            createdAt: new Date(),
            sender: {
              id: 'user1',
              nickname: t('groupchat:dummyData.nicknames.kind'),
            } as any,
          } as any,
        },
        {
          id: '2',
          groupId: currentGroup?.id || 'group1',
          name: t('groupchat:dummyData.exerciseChat'),
          description: t('groupchat:dummyData.exerciseChatDesc'),
          imageUrl: 'https://via.placeholder.com/100',
          maxMembers: 30,
          memberCount: 12,
          isPublic: true,
          lastMessageAt: new Date(Date.now() - 3600000),
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(Date.now() - 3600000),
          lastMessage: {
            id: 'msg2',
            chatId: '2',
            senderId: 'user2',
            content: t('groupchat:dummyData.messages.meetup'),
            type: 'TEXT',
            isEncrypted: true,
            createdAt: new Date(Date.now() - 3600000),
            sender: {
              id: 'user2',
              nickname: t('groupchat:dummyData.nicknames.fitness'),
            } as any,
          } as any,
        },
        {
          id: '3',
          groupId: currentGroup?.id || 'group1',
          name: t('groupchat:dummyData.foodChat'),
          description: t('groupchat:dummyData.foodChatDesc'),
          imageUrl: 'https://via.placeholder.com/100',
          maxMembers: 100,
          memberCount: 45,
          isPublic: true,
          createdAt: new Date(Date.now() - 172800000),
          updatedAt: new Date(Date.now() - 172800000),
        },
      ];
      
      setChats(dummyChats);
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

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color={COLORS.TEXT.MUTED} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('groupchat:search.placeholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.TEXT.MUTED}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleJoinPublicChat}>
          <Icon name="globe-outline" size={20} color={COLORS.PRIMARY} />
          <Text style={styles.actionText}>{t('groupchat:actions.browsePublic')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatItem chat={item} onPress={() => handleChatPress(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="chatbubbles-outline" size={60} color={COLORS.TEXT.MUTED} />
            <Text style={styles.emptyText}>{t('groupchat:empty.title')}</Text>
            <Text style={styles.emptySubtext}>{t('groupchat:empty.subtitle')}</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.PRIMARY]}
          />
        }
        contentContainerStyle={filteredChats.length === 0 ? styles.emptyListContent : null}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateChat}>
        <Icon name="add" size={28} color={COLORS.WHITE} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    marginHorizontal: SPACING.MD,
    marginTop: SPACING.MD,
    marginBottom: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: 25,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.SM,
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.PRIMARY,
  },
  quickActions: {
    paddingHorizontal: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY + '10',
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: 20,
  },
  actionText: {
    marginLeft: SPACING.XS,
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  chatAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: SPACING.MD,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
  },
  memberCount: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.MUTED,
    marginLeft: SPACING.SM,
  },
  chatDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.MUTED,
  },
  lastMessageTime: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.MUTED,
    marginLeft: SPACING.SM,
  },
  unreadBadge: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.XS,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL * 2,
  },
  emptyText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SPACING.MD,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.MUTED,
    marginTop: SPACING.XS,
    textAlign: 'center',
    paddingHorizontal: SPACING.XL,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    right: SPACING.MD,
    bottom: SPACING.XL,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});