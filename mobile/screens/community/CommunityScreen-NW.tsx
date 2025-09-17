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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '@/store/slices/authSlice';
import { useGroupStore } from '@/store/slices/groupSlice';
import { CommunityPost } from '@/../shared/types';
import { formatDistanceToNow } from '@/utils/dateUtils';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { ServerConnectionError } from '@/components/ServerConnectionError';

interface PostItemProps {
  post: CommunityPost;
  onPress: () => void;
}

const PostItem = ({ post, onPress }: PostItemProps) => {
  const { t } = useAndroidSafeTranslation();
  
  return (
    <TouchableOpacity 
      className="bg-white dark:bg-gray-800 mx-4 my-2 p-4 rounded-xl shadow-sm active:opacity-70"
      onPress={onPress}
    >
      {/* Author Info */}
      <View className="flex-row items-center mb-3">
        <Image 
          source={{ uri: post.author?.profileImage || 'https://via.placeholder.com/40' }}
          className="w-10 h-10 rounded-full mr-3"
        />
        <View className="flex-1">
          <Text className="text-gray-900 dark:text-white text-sm font-semibold">
            {post.author?.nickname || t('community:post.anonymous')}
          </Text>
          <Text className="text-gray-500 dark:text-gray-500 text-xs mt-0.5">
            {formatDistanceToNow(post.createdAt)} • {post.group?.name}
          </Text>
        </View>
        {post.isPinned && (
          <Icon name="pin" size={20} className="text-blue-500 dark:text-blue-400 ml-3" />
        )}
      </View>

      {/* Post Content */}
      <Text className="text-gray-900 dark:text-white text-base font-semibold mb-2" numberOfLines={2}>
        {post.title}
      </Text>
      <Text className="text-gray-600 dark:text-gray-400 text-sm leading-5 mb-3" numberOfLines={3}>
        {post.content}
      </Text>

      {/* Post Images */}
      {post.imageUrls && post.imageUrls.length > 0 && (
        <View className="flex-row mt-3 mb-3">
          {post.imageUrls.slice(0, 3).map((url, index) => (
            <Image key={index} source={{ uri: url }} className="w-20 h-20 rounded-lg mr-2" />
          ))}
          {post.imageUrls.length > 3 && (
            <View className="w-20 h-20 rounded-lg bg-black/50 justify-center items-center">
              <Text className="text-white text-lg font-bold">
                +{post.imageUrls.length - 3}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Post Stats */}
      <View className="flex-row mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <View className="flex-row items-center mr-6">
          <Icon name="eye-outline" size={16} className="text-gray-500 dark:text-gray-500" />
          <Text className="text-gray-500 dark:text-gray-500 text-xs ml-1">{post.viewCount}</Text>
        </View>
        <View className="flex-row items-center mr-6">
          <Icon name="heart-outline" size={16} className="text-gray-500 dark:text-gray-500" />
          <Text className="text-gray-500 dark:text-gray-500 text-xs ml-1">{post.likeCount}</Text>
        </View>
        <View className="flex-row items-center">
          <Icon name="chatbubble-outline" size={16} className="text-gray-500 dark:text-gray-500" />
          <Text className="text-gray-500 dark:text-gray-500 text-xs ml-1">{post.commentCount}</Text>
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
  const [serverConnectionError, setServerConnectionError] = useState(false);

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
      setServerConnectionError(false);
      
      // API 호출로 실제 데이터 가져오기
      // TODO: communityApi가 구현되면 주석 해제
      // try {
      //   const response = await communityApi.getPosts({
      //     groupId: currentGroup?.id,
      //     category: selectedCategory,
      //   });
      //   setPosts(response.data);
      // } catch (error) {
      //   console.error('Failed to load posts:', error);
      //   setServerConnectionError(true);
      //   setPosts([]);
      // }
      
      // 현재는 빈 배열로 설정 (서버 API 없음)
      setPosts([]);
      setServerConnectionError(true);
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
    <View className="bg-white dark:bg-gray-800 pb-3 border-b border-gray-200 dark:border-gray-700">
      {/* Category Tabs */}
      <View className="flex-row px-4 pt-4">
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            className={`px-4 py-2 mr-3 rounded-full ${
              selectedCategory === category.id 
                ? 'bg-blue-500 dark:bg-blue-600' 
                : 'bg-gray-100 dark:bg-gray-700'
            }`}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text
              className={`text-sm font-medium ${
                selectedCategory === category.id 
                  ? 'text-white' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // 서버 연결 에러 시 에러 화면 표시
  if (serverConnectionError) {
    return (
      <ServerConnectionError 
        onRetry={() => {
          setServerConnectionError(false);
          loadPosts();
        }}
        message="커뮤니티 게시글을 불러올 수 없습니다"
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
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostItem post={item} onPress={() => handlePostPress(item)} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-24">
            <Icon name="newspaper-outline" size={60} className="text-gray-400 dark:text-gray-600" />
            <Text className="text-gray-600 dark:text-gray-400 text-base mt-4">{t('community:empty.title')}</Text>
            <Text className="text-gray-500 dark:text-gray-500 text-sm mt-2">{t('community:empty.subtitle')}</Text>
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
        contentContainerStyle={posts.length === 0 ? { flexGrow: 1 } : undefined}
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        className="absolute right-4 bottom-6 w-14 h-14 bg-blue-500 dark:bg-blue-600 rounded-full justify-center items-center shadow-lg"
        onPress={handleCreatePost}
      >
        <Icon name="create-outline" size={24} className="text-white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};