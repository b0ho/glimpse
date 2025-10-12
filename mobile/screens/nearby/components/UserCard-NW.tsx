/**
 * 사용자 카드 컴포넌트 (NativeWind v4 버전)
 *
 * @module UserCard
 * @description 주변 사용자 정보를 표시하고 상호작용할 수 있는 카드 컴포넌트
 */
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

/**
 * UserCard Props 인터페이스
 *
 * @interface UserCardProps
 */
interface UserCardProps {
  /** 표시할 사용자 정보 */
  user: NearbyUser;
  /** 현재 로그인한 사용자 ID */
  currentUserId: string;
  /** 좋아요 전송 여부 */
  hasLiked: boolean;
  /** 좋아요 버튼 클릭 콜백 함수 */
  onLike: () => void;
  /** 메시지 버튼 클릭 콜백 함수 */
  onMessage: () => void;
}

/**
 * 사용자 카드 컴포넌트
 *
 * @component
 * @param {UserCardProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 사용자 정보 카드 UI
 *
 * @description
 * 주변 사용자의 정보를 카드 형태로 표시하고 좋아요/메시지 기능을 제공합니다.
 * - 프로필 이미지, 닉네임, 나이, 거리 표시
 * - 인증 배지 및 프리미엄 배지 표시
 * - 공통 그룹 수 표시
 * - 좋아요/메시지 버튼
 * - 매칭 여부에 따른 UI 변경
 * - 다크모드 지원
 *
 * @example
 * ```tsx
 * <UserCard
 *   user={nearbyUser}
 *   currentUserId="user123"
 *   hasLiked={false}
 *   onLike={() => sendLike(user.id)}
 *   onMessage={() => startChat(user.id)}
 * />
 * ```
 *
 * @category Component
 * @subcategory Nearby
 */
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