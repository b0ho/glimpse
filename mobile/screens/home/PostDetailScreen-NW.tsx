import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/slices/authSlice';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { ServerConnectionError } from '@/components/ServerConnectionError';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    nickname: string;
    profileImage?: string;
  };
  createdAt: Date;
  isLiked: boolean;
  likeCount: number;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    nickname: string;
    profileImage?: string;
  };
  group: {
    id: string;
    name: string;
  };
  createdAt: Date;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  comments: Comment[];
}

export const PostDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { postId } = route.params as { postId: string };
  const { colors, isDarkMode } = useTheme();
  const { t } = useAndroidSafeTranslation('post');
  const { user } = useAuthStore();
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverConnectionError, setServerConnectionError] = useState(false);

  useEffect(() => {
    loadPostDetail();
  }, [postId]);

  const loadPostDetail = async () => {
    setIsLoading(true);
    setServerConnectionError(false);
    try {
      // TODO: 실제 API 호출로 대체 필요
      // const response = await postApi.getPost(postId);
      // const commentsResponse = await postApi.getComments(postId);
      // setPost(response.data);
      // setComments(commentsResponse.data);
      
      // 현재는 서버 API가 없으므로 에러 상태 설정
      setPost(null);
      setComments([]);
      setServerConnectionError(true);
    } catch (error) {
      console.error('Failed to load post detail:', error);
      setPost(null);
      setComments([]);
      setServerConnectionError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikePost = () => {
    if (!post) return;
    
    setPost({
      ...post,
      isLiked: !post.isLiked,
      likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1,
    });
  };

  const handleLikeComment = (commentId: string) => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          isLiked: !comment.isLiked,
          likeCount: comment.isLiked ? comment.likeCount - 1 : comment.likeCount + 1,
        };
      }
      return comment;
    }));
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      Alert.alert(t('alerts.title'), t('alerts.commentRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      // 실제로는 API 호출
      const newCommentData: Comment = {
        id: `c${Date.now()}`,
        content: newComment,
        author: {
          id: user?.id || 'current_user',
          nickname: user?.nickname || '나',
        },
        createdAt: new Date(),
        isLiked: false,
        likeCount: 0,
      };

      setComments([...comments, newCommentData]);
      setNewComment('');
      
      if (post) {
        setPost({
          ...post,
          commentCount: post.commentCount + 1,
        });
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
      Alert.alert(t('alerts.title'), t('alerts.commentError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View className={cn(
      "px-4 py-3 border-b",
      "border-gray-200 dark:border-gray-800"
    )}>
      <View className="flex-row items-start">
        <View className="w-10 h-10 rounded-full bg-gray-300 justify-center items-center mr-3">
          <Text className="text-gray-600 font-semibold">
            {item.author.nickname.charAt(0)}
          </Text>
        </View>
        <View className="flex-1">
          <View className="flex-row justify-between items-center mb-1">
            <Text className={cn(
              "font-semibold",
              "text-gray-900 dark:text-white"
            )}>{item.author.nickname}</Text>
            <Text className={cn(
              "text-xs",
              "text-gray-400 dark:text-gray-500"
            )}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Text className={cn(
            "text-sm leading-5 mb-2",
            "text-gray-700 dark:text-gray-300"
          )}>{item.content}</Text>
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => handleLikeComment(item.id)}
          >
            <Icon
              name={item.isLiked ? "heart" : "heart-outline"}
              size={16}
              color={item.isLiked ? "#FF6B6B" : colors.TEXT.SECONDARY}
            />
            <Text className={cn(
              "text-xs ml-1",
              "text-gray-600 dark:text-gray-400"
            )}>{item.likeCount}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (serverConnectionError) {
    return (
      <ServerConnectionError 
        onRetry={loadPostDetail}
        message="게시물을 불러올 수 없습니다"
      />
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className={cn('flex-1 justify-center items-center bg-gray-50 dark:bg-gray-950')}>
        <ActivityIndicator size="large" color={colors.PRIMARY} />
        <Text className={cn(
          "mt-3 text-base",
          "text-gray-700 dark:text-gray-300"
        )}>{t('loading')}</Text>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView className={cn('flex-1 bg-gray-50 dark:bg-gray-950')}>
        <View className={cn(
          "flex-row items-center px-4 py-3 border-b",
          "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
        )}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={24} color={colors.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text className={cn(
            "flex-1 text-center text-lg font-semibold mr-6",
            "text-gray-900 dark:text-white"
          )}>{t('detail')}</Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <Text className={cn(
            "text-base",
            "text-gray-600 dark:text-gray-400"
          )}>{t('postNotFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={cn('flex-1 bg-gray-50 dark:bg-gray-950')}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className={cn(
          "flex-row items-center px-4 py-3 border-b",
          "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
        )}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={24} color={colors.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text className={cn(
            "flex-1 text-center text-lg font-semibold mr-6",
            "text-gray-900 dark:text-white"
          )}>{t('detail')}</Text>
        </View>

        {/* Content */}
        <ScrollView className="flex-1">
          <View className={cn(
            "px-4 py-4",
            "bg-white dark:bg-gray-900"
          )}>
            <Text className={cn(
              "text-xl font-bold mb-2",
              "text-gray-900 dark:text-white"
            )}>{post.title}</Text>
            
            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 rounded-full bg-gray-300 justify-center items-center mr-2">
                <Text className="text-gray-600 font-semibold text-xs">
                  {post.author.nickname.charAt(0)}
                </Text>
              </View>
              <Text className={cn(
                "text-sm",
                "text-gray-700 dark:text-gray-300"
              )}>{post.author.nickname}</Text>
              <Text className={cn(
                "text-sm mx-2",
                "text-gray-400 dark:text-gray-500"
              )}>·</Text>
              <Text className={cn(
                "text-sm",
                "text-gray-400 dark:text-gray-500"
              )}>{post.group.name}</Text>
            </View>

            <Text className={cn(
              "text-base leading-6 mb-4",
              "text-gray-700 dark:text-gray-300"
            )}>{post.content}</Text>

            <View className="flex-row items-center justify-between py-3 border-t border-gray-200 dark:border-gray-800">
              <TouchableOpacity
                className="flex-row items-center"
                onPress={handleLikePost}
              >
                <Icon
                  name={post.isLiked ? "heart" : "heart-outline"}
                  size={20}
                  color={post.isLiked ? "#FF6B6B" : colors.TEXT.SECONDARY}
                />
                <Text className={cn(
                  "text-sm ml-2",
                  "text-gray-600 dark:text-gray-400"
                )}>{post.likeCount}</Text>
              </TouchableOpacity>
              
              <View className="flex-row items-center">
                <Icon name="chatbubble-outline" size={20} color={colors.TEXT.SECONDARY} />
                <Text className={cn(
                  "text-sm ml-2",
                  "text-gray-600 dark:text-gray-400"
                )}>{post.commentCount}</Text>
              </View>
              
              <View className="flex-row items-center">
                <Icon name="eye-outline" size={20} color={colors.TEXT.SECONDARY} />
                <Text className={cn(
                  "text-sm ml-2",
                  "text-gray-600 dark:text-gray-400"
                )}>{post.viewCount}</Text>
              </View>
            </View>
          </View>

          {/* Comments */}
          <View className={cn(
            "mt-2",
            "bg-white dark:bg-gray-900"
          )}>
            <Text className={cn(
              "px-4 py-3 font-semibold",
              "text-gray-900 dark:text-white"
            )}>{t('comments')} ({comments.length})</Text>
            
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View className={cn(
          "flex-row items-center px-4 py-3 border-t",
          "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
        )}>
          <TextInput
            className={cn(
              "flex-1 px-4 py-2 rounded-full mr-2",
              "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
            )}
            placeholder={t('commentPlaceholder')}
            placeholderTextColor={colors.TEXT.SECONDARY}
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <TouchableOpacity
            className={cn(
              "px-4 py-2 rounded-full",
              newComment.trim() ? "bg-primary-500" : "bg-gray-300"
            )}
            onPress={handleSubmitComment}
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Icon name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};