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

interface ContentItemProps {
  item: Content;
  currentUserId?: string;
  remainingLikes: number;
  onLikeToggle: (contentId: string, authorId: string) => void;
  onEdit?: (content: Content) => void;
  onDelete?: (contentId: string) => void;
  groupName?: string;
}

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
        "mx-4 my-3 p-5 rounded-2xl",
        "bg-white dark:bg-gray-900",
        "border border-gray-200 dark:border-gray-800",
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
          <View className="w-12 h-12 rounded-full items-center justify-center mr-3 bg-gray-100 dark:bg-gray-800">
            <Icon 
              name="person" 
              size={24} 
              color="#EC4899" 
            />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900 dark:text-gray-100">
              {displayName}
            </Text>
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {formatTimeAgo(item.createdAt)}
              </Text>
              {groupName && (
                <>
                  <Text className="text-xs mx-1 text-gray-400 dark:text-gray-500">
                    •
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
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
        <Text className="text-sm leading-5 text-gray-800 dark:text-gray-200">
          {item.text || ''}
        </Text>
      </View>

      {/* Actions */}
      <View className="flex-row items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <TouchableOpacity
          onPress={handleLikePress}
          className={cn(
            "flex-row items-center px-3 py-1.5 rounded-full",
            item.isLikedByUser ? "bg-pink-50 dark:bg-pink-950" : "bg-gray-50 dark:bg-gray-800"
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
            item.isLikedByUser ? "text-pink-500" : "text-gray-600 dark:text-gray-400"
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