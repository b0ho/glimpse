import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { StoryUser as StoryUserType } from '@/utils/storyData';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

/**
 * StoryList 컴포넌트 Props
 * @interface StoryListProps
 */
interface StoryListProps {
  /** 스토리 목록 */
  stories: StoryUserType[];
  /** 스토리 클릭 핸들러 */
  onStoryPress: (userIndex: number) => void;
  /** 스토리 추가 핸들러 */
  onAddStoryPress: () => void;
  /** 현재 사용자 ID */
  currentUserId: string;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 새로고침 핸들러 */
  onRefresh?: () => void;
  /** 새로고침 상태 */
  refreshing?: boolean;
}

/**
 * 스토리 리스트 컴포넌트 - 인스타그램 스타일 스토리 목록
 * @component
 * @param {StoryListProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 스토리 리스트 UI
 * @description 사용자 스토리를 가로 스크롤 리스트로 표시하고 미확인 스토리 강조
 */
export const StoryList = ({
  stories,
  onStoryPress,
  onAddStoryPress,
  currentUserId,
  isLoading = false,
  onRefresh,
  refreshing = false,
}: StoryListProps) => {
  const { t } = useAndroidSafeTranslation();
  const { colors } = useTheme();
  
  // 입력 안전화 - 더 강력한 타입 체크
  const safeStories = Array.isArray(stories) ? stories : [];

  // Find current user's stories (가드 포함)
  const myStories = safeStories.length > 0 
    ? safeStories.find((story: any) => story?.userId === currentUserId) 
    : undefined;
  const otherStories = safeStories.length > 0 
    ? safeStories.filter((story: any) => story?.userId !== currentUserId) 
    : [];

  /**
   * 개별 스토리 아이템 렌더링
   * @param {Object} params - 리스트 아이템 파라미터
   * @param {StoryUserType} params.item - 스토리 사용자
   * @param {number} params.index - 리스트 인덱스
   * @returns {JSX.Element} 스토리 아이템 UI
   */
  const renderStoryItem = ({ item, index }: { item: StoryUserType; index: number }) => {
    const actualIndex = myStories ? index + 1 : index;
    const latestStory = item.stories[0]; // 최신 스토리를 프로필 이미지로 사용
    
    return (
      <TouchableOpacity
        className="items-center mr-4"
        onPress={() => onStoryPress(actualIndex)}
      >
        <View className="mb-2 relative">
          {item.hasUnviewedStories ? (
            <LinearGradient
              colors={[colors.PRIMARY, colors.SECONDARY || colors.PRIMARY]}
              className="w-18 h-18 rounded-full p-1"
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View className="flex-1 rounded-full p-1 bg-white dark:bg-gray-900">
                {latestStory?.imageUri ? (
                  <Image 
                    source={{ uri: latestStory.imageUri }} 
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <View className="w-full h-full rounded-full justify-center items-center bg-blue-500">
                    <Text className="text-white text-lg font-bold">
                      {item.nickname?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          ) : (
            <View className="w-18 h-18 rounded-full p-1 border-2 border-gray-300 dark:border-gray-600 relative">
              {latestStory?.imageUri ? (
                <Image 
                  source={{ uri: latestStory.imageUri }} 
                  className="w-full h-full rounded-full"
                />
              ) : (
                <View className="w-full h-full rounded-full justify-center items-center bg-blue-500">
                  <Text className="text-white text-lg font-bold">
                    {item.nickname?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
        <Text 
          className="text-gray-900 dark:text-white text-xs text-center w-18" 
          numberOfLines={1}
        >
          {item.nickname || '익명'}
        </Text>
      </TouchableOpacity>
    );
  };

  /**
   * 내 스토리 렌더링
   * @returns {JSX.Element} 내 스토리 또는 스토리 추가 버튼 UI
   */
  const renderMyStory = () => {
    if (myStories && myStories.stories.length > 0) {
      const latestStory = myStories.stories[0];
      
      return (
        <TouchableOpacity className="items-center mr-4" onPress={() => onStoryPress(0)}>
          <View className="mb-2 relative">
            <View className="w-18 h-18 rounded-full p-1 border-2 border-gray-300 dark:border-gray-600 relative">
              {latestStory?.imageUri ? (
                <Image 
                  source={{ uri: latestStory.imageUri }} 
                  className="w-full h-full rounded-full"
                />
              ) : (
                <View className="w-full h-full rounded-full justify-center items-center bg-blue-500">
                  <Text className="text-white text-lg font-bold">
                    {myStories.nickname?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              {/* 내 스토리에 + 아이콘 추가 */}
              <View className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-1">
                <Ionicons name="add-circle" size={20} color={colors.PRIMARY} />
              </View>
            </View>
          </View>
          <Text 
            className="text-gray-900 dark:text-white text-xs text-center w-18" 
            numberOfLines={1}
          >
            내 스토리
          </Text>
        </TouchableOpacity>
      );
    }

    // Add story button
    return (
      <TouchableOpacity className="items-center mr-4" onPress={onAddStoryPress}>
        <View className="w-18 h-18 rounded-full p-1">
          <View className="flex-1 rounded-full justify-center items-center bg-gray-600 dark:bg-gray-700">
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </View>
        </View>
        <Text className="text-gray-900 dark:text-white text-xs text-center w-18 mt-2">
          스토리 추가
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoading && safeStories.length === 0) {
    return (
      <View className="h-30 justify-center items-center">
        <ActivityIndicator size="small" color={colors.PRIMARY} />
      </View>
    );
  }

  return (
    <View className="py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={otherStories}
        renderItem={renderStoryItem}
        keyExtractor={(item) => item.userId}
        ListHeaderComponent={renderMyStory}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
    </View>
  );
};