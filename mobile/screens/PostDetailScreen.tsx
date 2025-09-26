import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { ServerConnectionError } from '@/components/ServerConnectionError';

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
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation(['post', 'common']);
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

      Alert.alert(t('alerts.success'), t('alerts.commentSuccess'));
    } catch (error) {
      Alert.alert(t('alerts.error'), t('alerts.commentDeleteFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert(
      t('detail.deleteTitle'),
      t('detail.deleteConfirm'),
      [
        { text: t('detail.cancel'), style: 'cancel' },
        {
          text: t('detail.delete'),
          style: 'destructive',
          onPress: () => {
            setComments(comments.filter(c => c.id !== commentId));
            if (post) {
              setPost({
                ...post,
                commentCount: Math.max(0, post.commentCount - 1),
              });
            }
            Alert.alert(t('alerts.success'), t('alerts.commentDeleted'));
          },
        },
      ]
    );
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString();
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const isMyComment = item.author.id === user?.id;

    return (
      <View style={[styles.commentItem, { backgroundColor: colors.SURFACE }]}>
        <View style={styles.commentHeader}>
          <View style={styles.commentAuthor}>
            <View style={[styles.commentAvatar, { backgroundColor: colors.PRIMARY + '20' }]}>
              <Text style={[styles.commentAvatarText, { color: colors.PRIMARY }]}>
                {item.author.nickname[0]}
              </Text>
            </View>
            <View>
              <Text style={[styles.commentAuthorName, { color: colors.TEXT.PRIMARY }]}>
                {item.author.nickname}
              </Text>
              <Text style={[styles.commentTime, { color: colors.TEXT.TERTIARY }]}>
                {formatTime(item.createdAt)}
              </Text>
            </View>
          </View>
          
          {isMyComment && (
            <TouchableOpacity onPress={() => handleDeleteComment(item.id)}>
              <Icon name="trash-outline" size={18} color={colors.TEXT.TERTIARY} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.commentContent, { color: colors.TEXT.PRIMARY }]}>
          {item.content}
        </Text>

        <TouchableOpacity 
          style={styles.commentLikeButton}
          onPress={() => handleLikeComment(item.id)}
        >
          <Icon 
            name={item.isLiked ? "heart" : "heart-outline"} 
            size={16} 
            color={item.isLiked ? colors.ERROR : colors.TEXT.TERTIARY} 
          />
          <Text style={[styles.commentLikeCount, { color: colors.TEXT.TERTIARY }]}>
            {item.likeCount}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 서버 연결 에러 시 에러 화면 표시
  if (serverConnectionError) {
    return (
      <ServerConnectionError 
        onRetry={() => {
          setServerConnectionError(false);
          loadPostDetail();
        }}
        message={t('common:errors.loadErrors.post')}
      />
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.TEXT.PRIMARY }]}>
            {t('post:detail.notFound')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* 헤더 */}
        <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>{t('title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 게시물 내용 */}
          <View style={[styles.postContainer, { backgroundColor: colors.SURFACE }]}>
            <View style={styles.postHeader}>
              <View style={[styles.authorAvatar, { backgroundColor: colors.PRIMARY + '20' }]}>
                <Text style={[styles.authorAvatarText, { color: colors.PRIMARY }]}>
                  {post.author.nickname[0]}
                </Text>
              </View>
              <View style={styles.postInfo}>
                <Text style={[styles.authorName, { color: colors.TEXT.PRIMARY }]}>
                  {post.author.nickname}
                </Text>
                <Text style={[styles.postMeta, { color: colors.TEXT.TERTIARY }]}>
                  {post.group.name} · {formatTime(post.createdAt)}
                </Text>
              </View>
            </View>

            <Text style={[styles.postTitle, { color: colors.TEXT.PRIMARY }]}>
              {post.title}
            </Text>
            <Text style={[styles.postContent, { color: colors.TEXT.SECONDARY }]}>
              {post.content}
            </Text>

            <View style={styles.postStats}>
              <Text style={[styles.statText, { color: colors.TEXT.TERTIARY }]}>
                {t('post:detail.stats.views')} {post.viewCount}
              </Text>
              <Text style={[styles.statText, { color: colors.TEXT.TERTIARY }]}>
                {t('post:detail.stats.comments')} {post.commentCount}
              </Text>
            </View>

            <View style={[styles.postActions, { borderTopColor: colors.BORDER }]}>
              <TouchableOpacity style={styles.actionButton} onPress={handleLikePost}>
                <Icon 
                  name={post.isLiked ? "heart" : "heart-outline"} 
                  size={20} 
                  color={post.isLiked ? colors.ERROR : colors.TEXT.SECONDARY} 
                />
                <Text style={[styles.actionText, { color: colors.TEXT.SECONDARY }]}>
                  {post.likeCount}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="share-social-outline" size={20} color={colors.TEXT.SECONDARY} />
                <Text style={[styles.actionText, { color: colors.TEXT.SECONDARY }]}>
                  {t('post:detail.actions.share')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 댓글 목록 */}
          <View style={styles.commentsSection}>
            <Text style={[styles.commentsSectionTitle, { color: colors.TEXT.PRIMARY }]}>
              {t('post:detail.stats.comments')} {comments.length}
            </Text>
            
            {comments.length > 0 ? (
              <FlatList
                data={comments}
                renderItem={renderComment}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: SPACING.SM }} />}
              />
            ) : (
              <View style={styles.emptyComments}>
                <Text style={[styles.emptyCommentsText, { color: colors.TEXT.TERTIARY }]}>
                  {t('post:detail.emptyComments')}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* 댓글 입력 */}
        <View style={[styles.commentInput, { backgroundColor: colors.SURFACE, borderTopColor: colors.BORDER }]}>
          <TextInput
            style={[styles.commentTextInput, { 
              backgroundColor: colors.BACKGROUND, 
              color: colors.TEXT.PRIMARY,
              borderColor: colors.BORDER,
            }]}
            placeholder={t('detail.commentPlaceholder')}
            placeholderTextColor={colors.TEXT.TERTIARY}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.submitButton, { 
              backgroundColor: newComment.trim() ? colors.PRIMARY : colors.BORDER,
            }]}
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: FONT_SIZES.MD,
  },
  postContainer: {
    padding: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.SM,
  },
  authorAvatarText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  postInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  postMeta: {
    fontSize: FONT_SIZES.XS,
    marginTop: 2,
  },
  postTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '700',
    marginBottom: SPACING.SM,
  },
  postContent: {
    fontSize: FONT_SIZES.MD,
    lineHeight: 22,
    marginBottom: SPACING.MD,
  },
  postStats: {
    flexDirection: 'row',
    gap: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  statText: {
    fontSize: FONT_SIZES.SM,
  },
  postActions: {
    flexDirection: 'row',
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
    gap: SPACING.LG,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
  },
  actionText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '500',
  },
  commentsSection: {
    padding: SPACING.MD,
  },
  commentsSectionTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    marginBottom: SPACING.MD,
  },
  commentItem: {
    padding: SPACING.MD,
    borderRadius: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  commentAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.SM,
  },
  commentAvatarText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  commentAuthorName: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: FONT_SIZES.XS,
    marginTop: 2,
  },
  commentContent: {
    fontSize: FONT_SIZES.SM,
    lineHeight: 20,
    marginBottom: SPACING.SM,
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
  },
  commentLikeCount: {
    fontSize: FONT_SIZES.XS,
  },
  emptyComments: {
    padding: SPACING.XL,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: FONT_SIZES.MD,
  },
  commentInput: {
    flexDirection: 'row',
    padding: SPACING.MD,
    borderTopWidth: 1,
    alignItems: 'flex-end',
    gap: SPACING.SM,
  },
  commentTextInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    fontSize: FONT_SIZES.SM,
    borderWidth: 1,
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});