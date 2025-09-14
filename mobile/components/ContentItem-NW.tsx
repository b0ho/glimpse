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
  const { colors, isDarkMode } = useTheme();
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
        "mx-4 my-2 p-4 rounded-2xl",
        isDarkMode ? "bg-gray-800" : "bg-white",
        Platform.select({
          ios: "shadow-sm",
          android: "elevation-2",
          web: "shadow-md"
        })
      )}
      onPress={handlePostPress}
      activeOpacity={0.9}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View className={cn(
            "w-10 h-10 rounded-full items-center justify-center mr-3",
            isDarkMode ? "bg-gray-700" : "bg-gray-100"
          )}>
            <Icon 
              name="person-outline" 
              size={20} 
              color={isDarkMode ? "#9CA3AF" : "#6B7280"} 
            />
          </View>
          <View className="flex-1">
            <Text className={cn(
              "text-sm font-semibold",
              isDarkMode ? "text-gray-100" : "text-gray-900"
            )}>
              {displayName}
            </Text>
            <View className="flex-row items-center">
              <Text className={cn(
                "text-xs",
                isDarkMode ? "text-gray-400" : "text-gray-500"
              )}>
                {formatTimeAgo(item.createdAt)}
              </Text>
              {groupName && (
                <>
                  <Text className={cn(
                    "text-xs mx-1",
                    isDarkMode ? "text-gray-500" : "text-gray-400"
                  )}>
                    •
                  </Text>
                  <Text className={cn(
                    "text-xs",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>
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
              color={isDarkMode ? "#9CA3AF" : "#6B7280"} 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View className="mb-3">
        <Text className={cn(
          "text-sm leading-5",
          isDarkMode ? "text-gray-200" : "text-gray-800"
        )}>
          {item.text || ''}
        </Text>
      </View>

      {/* Actions */}
      <View className="flex-row items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <TouchableOpacity
          onPress={handleLikePress}
          className="flex-row items-center"
          disabled={isOwnContent}
        >
          <Icon
            name={item.isLikedByUser ? "heart" : "heart-outline"}
            size={20}
            color={item.isLikedByUser ? colors.PRIMARY : (isDarkMode ? "#9CA3AF" : "#6B7280")}
          />
          <Text className={cn(
            "ml-1 text-sm",
            item.isLikedByUser ? "text-primary-500" : (isDarkMode ? "text-gray-400" : "text-gray-600")
          )}>
            {item.likeCount || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePostPress}
          className="flex-row items-center"
        >
          <Icon
            name="chatbubble-outline"
            size={18}
            color={isDarkMode ? "#9CA3AF" : "#6B7280"}
          />
          <Text className={cn(
            "ml-1 text-sm",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            {item.commentCount || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center">
          <Icon
            name="share-outline"
            size={18}
            color={isDarkMode ? "#9CA3AF" : "#6B7280"}
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
              <View className={cn(
                "mx-4 mb-4 rounded-2xl overflow-hidden",
                isDarkMode ? "bg-gray-800" : "bg-white"
              )}>
                <TouchableOpacity
                  onPress={handleEdit}
                  className={cn(
                    "px-4 py-4 border-b",
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  )}
                >
                  <Text className={cn(
                    "text-base text-center",
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  )}>
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
              className={cn(
                "mx-4 mb-8 py-4 rounded-2xl",
                isDarkMode ? "bg-gray-800" : "bg-white"
              )}
            >
              <Text className={cn(
                "text-base text-center font-medium",
                isDarkMode ? "text-gray-100" : "text-gray-900"
              )}>
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