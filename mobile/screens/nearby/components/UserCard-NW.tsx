import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { NearbyUser } from '@/types';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface UserCardProps {
  user: NearbyUser;
  currentUserId: string;
  hasLiked: boolean;
  onLike: () => void;
  onMessage: () => void;
}

export const UserCard = ({
  user,
  currentUserId,
  hasLiked,
  onLike,
  onMessage,
}) => {
  const { t } = useAndroidSafeTranslation();
  const { isDarkMode } = useTheme();
  const isMatch = false; // TODO: Check if user is matched with current user
  
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <View className="flex-row p-3 mx-5 my-2 rounded-xl shadow-sm bg-white dark:bg-gray-900">
      <Image
        source={{ uri: user.profileImage || 'https://via.placeholder.com/150' }}
        className="w-20 h-20 rounded-full bg-gray-200"
      />
      
      <View className="flex-1 ml-3 justify-center">
        <View className="flex-row items-center mb-1">
          <Text className="text-lg font-semibold mr-1 text-gray-900 dark:text-white">
            {user.nickname}
          </Text>
          {user.isVerified && (
            <Icon name="checkmark-circle" size={16} color="#3B82F6" />
          )}
          {user.isPremium && (
            <Icon name="star" size={16} color="#F59E0B" style={{ marginLeft: 4 }} />
          )}
        </View>
        
        <View className="flex-row items-center mb-2">
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            {t('nearbyusers:user.age', { age: user.age || '??' })}
          </Text>
          <Text className="mx-1 text-gray-400 dark:text-gray-500">
            •
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            {formatDistance(user.distance)}
          </Text>
          {user.commonGroups && user.commonGroups.length > 0 && (
            <>
              <Text className={cn(
                "mx-1",
                "text-gray-400 dark:text-gray-500"
              )}>
                •
              </Text>
              <Text className={cn(
                "text-sm",
                "text-gray-600 dark:text-gray-400"
              )}>
                {t('nearbyusers:user.commonGroups', { count: user.commonGroups.length })}
              </Text>
            </>
          )}
        </View>
        
        {user.bio && (
          <Text 
            className="text-sm leading-5 text-gray-600 dark:text-gray-400"
            numberOfLines={2}
          >
            {user.bio}
          </Text>
        )}
      </View>
      
      <View className="justify-center pl-3">
        {isMatch ? (
          <TouchableOpacity 
            className="w-12 h-12 rounded-full bg-blue-500 justify-center items-center"
            onPress={onMessage}
          >
            <Icon name="chatbubble-ellipses" size={20} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className={cn(
              "w-12 h-12 rounded-full justify-center items-center",
              hasLiked 
                ? "bg-blue-500" 
                : "bg-blue-100 dark:bg-blue-500/20"
            )}
            onPress={onLike}
            disabled={hasLiked}
          >
            <Icon
              name={hasLiked ? "heart" : "heart-outline"}
              size={24}
              color={hasLiked ? "white" : "#3B82F6"}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};