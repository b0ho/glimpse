import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '@/types/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import { Content } from '@/types';
import { formatTimeAgo } from '@/utils/dateUtils';
import { useLikeStore } from '@/store/slices/likeSlice';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

/**
 * 컨텐츠 아이템 컴포넌트 Props
 *
 * @interface ContentItemProps
 */
interface ContentItemProps {
  /** 컨텐츠 아이템 데이터 */
  item: Content;
  /** 현재 사용자 ID */
  currentUserId?: string;
  /** 남은 좋아요 수 */
  remainingLikes: number;
  /** 좋아요 토글 핸들러 */
  onLikeToggle: (contentId: string, authorId: string) => void;
  /** 콘텐츠 수정 핸들러 */
  onEdit?: (content: Content) => void;
  /** 콘텐츠 삭제 핸들러 */
  onDelete?: (contentId: string) => void;
  /** 그룹명 */
  groupName?: string;
}

/**
 * 홈 피드 컨텐츠 아이템 컴포넌트 (NativeWind 버전)
 *
 * @description NativeWind v4를 사용한 컨텐츠 카드 컴포넌트.
 *              다크모드 자동 지원 및 플랫폼별 최적화된 스타일링 제공.
 *
 * @component Feature
 * @props ContentItemProps
 * @usage HomeScreen, GroupDetailScreen (NativeWind 마이그레이션 버전)
 *
 * @example
 * <ContentItem
 *   item={contentData}
 *   currentUserId="user123"
 *   remainingLikes={5}
 *   onLikeToggle={handleLike}
 * />
 */
export const ContentItem: React.FC<ContentItemProps> = React.memo(({
  item,
  currentUserId,
  remainingLikes,
  onLikeToggle,
  onEdit,
  onDelete,
  groupName,
}) => {
  const isOwnContent = item.authorId === currentUserId;
  const { getUserDisplayName } = useLikeStore();
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation();
  const navigation = useNavigation<StackNavigationProp<HomeStackParamList>>();
  const [showMenu, setShowMenu] = useState(false);
  
  const displayName = item.authorNickname || getUserDisplayName(item.authorId || '', currentUserId || '') || t('common:user.defaultName');

  const handleEdit = () => {
    setShowMenu(false);
    onEdit?.(item);
  };

  const handleDelete = () => {
    setShowMenu(false);
    Alert.alert(
      t('common:actions.delete'),
      t('post:deleteConfirmMessage'),
      [
        { text: t('common:actions.cancel'), style: 'cancel' },
        { 
          text: t('common:actions.delete'), 
          style: 'destructive',
          onPress: () => onDelete?.(item.id)
        }
      ]
    );
  };

  const handlePostPress = () => {
    navigation.navigate('PostDetail', { 
      postId: item.id,
      groupName: groupName || '',
    });
  };

  const handleLikePress = () => {
    if (isOwnContent) {
      Alert.alert(
        t('matching:errors.selfLike'),
        t('matching:errors.selfLikeDescription')
      );
      return;
    }

    if (!item.isLikedByUser && remainingLikes <= 0) {
      Alert.alert(
        t('matching:errors.noLikesRemaining'),
        t('matching:errors.noLikesDescription'),
        [
          { text: t('common:cancel'), style: 'cancel' },
          {
            text: t('common:getPremium'),
            onPress: () => navigation.navigate('Premium' as never),
          },
        ]
      );
      return;
    }

    onLikeToggle(item.id, item.authorId || '');
  };

  return (
    <TouchableOpacity
      className={cn(
        "mx-4 my-3 p-5 rounded-lg",
        "bg-card dark:bg-card-dark",
        "border border-border dark:border-border-dark",
        Platform.select({
          ios: "shadow-lg shadow-pink-200/50",
          android: "elevation-4",
          web: "shadow-lg shadow-pink-200/30"
        })
      )}
      onPress={handlePostPress}
      activeOpacity={0.95}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 rounded-full items-center justify-center mr-3 bg-muted dark:bg-muted-dark">
            <Icon 
              name="person" 
              size={24} 
              color="#EC4899" 
            />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-foreground dark:text-foreground-dark">
              {displayName}
            </Text>
            <View className="flex-row items-center">
              <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
                {formatTimeAgo(item.createdAt)}
              </Text>
              {groupName && (
                <>
                  <Text className="text-xs mx-1 text-gray-400 dark:text-gray-500">
                    •
                  </Text>
                  <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
                    {groupName}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
        
        {isOwnContent && (
          <TouchableOpacity
            onPress={() => setShowMenu(true)}
            className="p-1"
          >
            <Icon 
              name="ellipsis-horizontal" 
              size={20} 
              color={colors.TEXT.SECONDARY} 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View className="mb-3">
        <Text className="text-sm leading-5 text-foreground dark:text-foreground-dark">
          {item.text || ''}
        </Text>
      </View>

      {/* Actions */}
      <View className="flex-row items-center justify-between pt-4 border-t border-border dark:border-border-dark">
        <TouchableOpacity
          onPress={handleLikePress}
          className={cn(
            "flex-row items-center px-3 py-1.5 rounded-full",
            item.isLikedByUser ? "bg-primary/10 dark:bg-primary-dark/20" : "bg-muted dark:bg-muted-dark"
          )}
          disabled={isOwnContent}
        >
          <Icon
            name={item.isLikedByUser ? "heart" : "heart-outline"}
            size={22}
            color={item.isLikedByUser ? "#EC4899" : colors.TEXT.SECONDARY}
          />
          <Text className={cn(
            "ml-1.5 text-sm font-medium",
            item.isLikedByUser ? "text-primary dark:text-primary-dark" : "text-muted-foreground dark:text-muted-foreground-dark"
          )}>
            {item.likeCount || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePostPress}
          className="flex-row items-center px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950"
        >
          <Icon
            name="chatbubble-outline"
            size={20}
            color="#A855F7"
          />
          <Text className="ml-1.5 text-sm font-medium text-purple-600 dark:text-purple-400">
            {item.commentCount || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800">
          <Icon
            name="share-outline"
            size={20}
            color={colors.TEXT.SECONDARY}
          />
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
          <View className="flex-1 justify-end bg-black/50">
            <TouchableWithoutFeedback>
              <View className="mx-4 mb-4 rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
                <TouchableOpacity
                  onPress={handleEdit}
                  className="px-4 py-4 border-b border-gray-200 dark:border-gray-700"
                >
                  <Text className="text-base text-center text-gray-900 dark:text-gray-100">
                    {t('common:actions.edit')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDelete}
                  className="px-4 py-4"
                >
                  <Text className="text-base text-center text-red-500">
                    {t('common:actions.delete')}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
            <TouchableOpacity
              onPress={() => setShowMenu(false)}
              className="mx-4 mb-8 py-4 rounded-2xl bg-white dark:bg-gray-900"
            >
              <Text className="text-base text-center font-medium text-gray-900 dark:text-gray-100">
                {t('common:actions.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </TouchableOpacity>
  );
});

ContentItem.displayName = 'ContentItem';