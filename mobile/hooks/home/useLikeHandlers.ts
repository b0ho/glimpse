/**
 * 좋아요 관련 핸들러 관리 훅
 */
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { Content } from '@/types';
import { useAuthStore } from '@/store/slices/authSlice';
import { useLikeStore } from '@/store/slices/likeSlice';
import { useNavigation } from '@react-navigation/native';

interface UseLikeHandlersProps {
  contents: Content[];
  setContents: React.Dispatch<React.SetStateAction<Content[]>>;
  t: (key: string, options?: any) => string;
}

export const useLikeHandlers = ({ contents, setContents, t }: UseLikeHandlersProps) => {
  const navigation = useNavigation() as any;
  const authStore = useAuthStore();
  const likeStore = useLikeStore();

  /**
   * 좋아요 토글 핸들러
   */
  const handleLikeToggle = useCallback(async (contentId: string, authorId: string) => {
    const content = contents.find(c => c.id === contentId);
    if (!content) return;

    // 자기 자신의 콘텐츠에는 좋아요 불가
    if (authorId === authStore.user?.id) {
      Alert.alert(t('common:status.notification'), t('matching:like.selfLikeNotAllowed'));
      return;
    }

    // 이미 좋아요를 눌렀다면
    if (content.isLikedByUser) {
      Alert.alert(t('common:status.notification'), t('matching:like.alreadyLiked'));
      return;
    }

    // 일일 좋아요 한도 체크
    if (!likeStore.canSendLike(authorId)) {
      const remainingLikes = likeStore.getRemainingFreeLikes();
      if (remainingLikes === 0) {
        Alert.alert(
          t('matching:like.limitExceeded'),
          t('matching:like.dailyLimitMessage'),
          [
            { text: t('common:buttons.cancel'), style: 'cancel' },
            { text: t('matching:like.buyMoreLikes'), onPress: () => navigation.navigate('Premium') },
          ]
        );
        return;
      } else {
        Alert.alert(t('common:status.notification'), t('matching:like.cooldownMessage', { days: 14 }));
        return;
      }
    }

    try {
      // 좋아요 보내기 (Zustand store 사용)
      const success = await likeStore.sendLike(authorId, 'default_group_id');
      
      if (success) {
        // 로컬 상태 업데이트 (optimistic update)
        setContents(prevContents => 
          prevContents.map(c => 
            c.id === contentId 
              ? { ...c, likeCount: (c.likeCount || 0) + 1, isLikedByUser: true }
              : c
          )
        );

        Alert.alert(
          t('home:likeMessage.title'),
          t('home:likeMessage.description', { name: content.authorNickname })
        );
      }
    } catch (error) {
      console.error('Like toggle error:', error);
      Alert.alert(t('common:status.error'), t('home:errors.likeError'));
    }
  }, [contents, authStore.user?.id, likeStore, setContents, navigation, t]);

  /**
   * 콘텐츠 편집 핸들러
   */
  const handleEditContent = useCallback((content: Content) => {
    navigation.navigate('CreateContent', { editContent: content });
  }, [navigation]);

  /**
   * 콘텐츠 삭제 핸들러
   */
  const handleDeleteContent = useCallback((contentId: string) => {
    Alert.alert(
      t('home:delete.title'),
      t('home:delete.message'),
      [
        { text: t('common:buttons.cancel'), style: 'cancel' },
        {
          text: t('common:buttons.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: API 호출로 삭제 처리
              setContents(prevContents => prevContents.filter(c => c.id !== contentId));
              Alert.alert(t('common:status.success'), t('home:delete.success'));
            } catch (error) {
              console.error('Delete content error:', error);
              Alert.alert(t('common:status.error'), t('home:delete.error'));
            }
          },
        },
      ]
    );
  }, [setContents, t]);

  return {
    handleLikeToggle,
    handleEditContent,
    handleDeleteContent,
  };
};