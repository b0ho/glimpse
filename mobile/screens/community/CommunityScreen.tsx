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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '@/store/slices/authSlice';
import { useGroupStore } from '@/store/slices/groupSlice';
import { CommunityPost } from '../../shared/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { formatDistanceToNow } from '@/utils/dateUtils';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';

interface PostItemProps {
  post: CommunityPost;
  onPress: () => void;
}

const PostItem= ({ post, onPress }) => {
  const { t } = useAndroidSafeTranslation();
  
  return (
    <TouchableOpacity style={styles.postCard} onPress={onPress} activeOpacity={0.7}>
      {/* Author Info */}
      <View style={styles.authorRow}>
        <Image 
          source={{ uri: post.author?.profileImage || 'https://via.placeholder.com/40' }}
          style={styles.authorAvatar}
        />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{post.author?.nickname || t('community:post.anonymous')}</Text>
          <Text style={styles.postTime}>
            {formatDistanceToNow(post.createdAt)} • {post.group?.name}
          </Text>
        </View>
        {post.isPinned && (
          <Icon name="pin" size={20} color={COLORS.PRIMARY} style={styles.pinIcon} />
        )}
      </View>

      {/* Post Content */}
      <Text style={styles.postTitle} numberOfLines={2}>{post.title}</Text>
      <Text style={styles.postContent} numberOfLines={3}>{post.content}</Text>

      {/* Post Images */}
      {post.imageUrls && post.imageUrls.length > 0 && (
        <View style={styles.imageContainer}>
          {post.imageUrls.slice(0, 3).map((url, index) => (
            <Image key={index} source={{ uri: url }} style={styles.postImage} />
          ))}
          {post.imageUrls.length > 3 && (
            <View style={[styles.postImage, styles.moreImagesOverlay]}>
              <Text style={styles.moreImagesText}>{t('community:post.moreImages', { count: post.imageUrls.length - 3 })}</Text>
            </View>
          )}
        </View>
      )}

      {/* Post Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Icon name="eye-outline" size={16} color={COLORS.TEXT.MUTED} />
          <Text style={styles.statText}>{post.viewCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="heart-outline" size={16} color={COLORS.TEXT.MUTED} />
          <Text style={styles.statText}>{post.likeCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="chatbubble-outline" size={16} color={COLORS.TEXT.MUTED} />
          <Text style={styles.statText}>{post.commentCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const CommunityScreen = () => {
  const navigation = useNavigation() as any;
  const { user } = useAuthStore();
  const { currentGroup } = useGroupStore();
  const { t } = useAndroidSafeTranslation();
  
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: t('community:categories.all') },
    { id: 'popular', name: t('community:categories.popular') },
    { id: 'recent', name: t('community:categories.recent') },
    { id: 'my', name: t('community:categories.my') },
  ];

  useEffect(() => {
    loadPosts();
  }, [currentGroup, selectedCategory]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      // TODO: API 호출로 실제 데이터 가져오기
      // const response = await communityApi.getPosts({
      //   groupId: currentGroup?.id,
      //   category: selectedCategory,
      // });
      
      // 더미 데이터
      const dummyPosts: CommunityPost[] = [
        {
          id: '1',
          authorId: 'user1',
          groupId: currentGroup?.id || 'group1',
          title: 'Anyone want to have lunch together today?',
          content: 'Looking for someone to have lunch with at a restaurant near the company. Let\'s meet at the lobby on the 1st floor at 12:30!',
          imageUrls: [],
          viewCount: 45,
          likeCount: 12,
          commentCount: 5,
          isPinned: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {
            id: 'user1',
            nickname: 'Food Explorer',
            profileImage: 'https://via.placeholder.com/100',
          } as any,
        },
        {
          id: '2',
          authorId: 'user2',
          groupId: currentGroup?.id || 'group1',
          title: 'Anyone joining the weekend hiking group?',
          content: 'Recruiting people to go hiking at Bukhansan this weekend. Beginners are welcome! We plan to depart at 8 AM.',
          imageUrls: ['https://via.placeholder.com/300', 'https://via.placeholder.com/300'],
          viewCount: 120,
          likeCount: 25,
          commentCount: 15,
          createdAt: new Date(Date.now() - 3600000),
          updatedAt: new Date(Date.now() - 3600000),
          author: {
            id: 'user2',
            nickname: 'Mountain Lover',
            profileImage: 'https://via.placeholder.com/100',
          } as any,
        },
      ];
      
      setPosts(dummyPosts);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadPosts();
  }, []);

  const handlePostPress = (post: CommunityPost) => {
    navigation.navigate('PostDetail', { postId: post.id });
  };

  const handleCreatePost = () => {
    navigation.navigate('CreatePost');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Category Tabs */}
      <View style={styles.categoryContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              selectedCategory === category.id && styles.categoryTabActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
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
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostItem post={item} onPress={() => handlePostPress(item)} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="newspaper-outline" size={60} color={COLORS.TEXT.MUTED} />
            <Text style={styles.emptyText}>{t('community:empty.title')}</Text>
            <Text style={styles.emptySubtext}>{t('community:empty.subtitle')}</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.PRIMARY]}
          />
        }
        contentContainerStyle={posts.length === 0 ? styles.emptyListContent : null}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreatePost}>
        <Icon name="create-outline" size={24} color={COLORS.WHITE} />
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
  header: {
    backgroundColor: COLORS.WHITE,
    paddingBottom: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.MD,
  },
  categoryTab: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    marginRight: SPACING.SM,
    borderRadius: 20,
    backgroundColor: COLORS.BACKGROUND,
  },
  categoryTabActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  categoryText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: COLORS.WHITE,
  },
  postCard: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.SM,
    padding: SPACING.MD,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.SM,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  postTime: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.MUTED,
    marginTop: 2,
  },
  pinIcon: {
    marginLeft: SPACING.SM,
  },
  postTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.XS,
  },
  postContent: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 20,
    marginBottom: SPACING.SM,
  },
  imageContainer: {
    flexDirection: 'row',
    marginTop: SPACING.SM,
    marginBottom: SPACING.SM,
  },
  postImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: SPACING.XS,
  },
  moreImagesOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: SPACING.SM,
    paddingTop: SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.LG,
  },
  statText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.MUTED,
    marginLeft: 4,
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
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});