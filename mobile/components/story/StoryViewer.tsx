import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Animated,
} from 'react-native';
import { Video, ResizeMode } from 'expo-video';
import { AVPlaybackStatus } from 'expo-audio';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { cn } from '@/utils/cn';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * 스토리 인터페이스
 * @interface Story
 */
interface Story {
  /** 스토리 ID */
  id: string;
  /** 미디어 URL */
  mediaUrl: string;
  /** 미디어 타입 */
  mediaType: 'IMAGE' | 'VIDEO';
  /** 캐픽션 */
  caption?: string;
  /** 생성 시간 */
  createdAt: string;
  /** 조회수 */
  viewCount?: number;
  /** 사용자 정보 */
  user: {
    /** 사용자 ID */
    id: string;
    /** 닉네임 */
    nickname: string;
    /** 프로필 이미지 URL */
    profileImage?: string;
  };
  /** 시청 여부 */
  isViewed?: boolean;
}

/**
 * 스토리 그룹 인터페이스
 * @interface StoryGroup
 */
interface StoryGroup {
  /** 사용자 정보 */
  user: {
    /** 사용자 ID */
    id: string;
    /** 닉네임 */
    nickname: string;
    /** 프로필 이미지 URL */
    profileImage?: string;
  };
  /** 스토리 목록 */
  stories: Story[];
  /** 미확인 스토리 여부 */
  hasUnviewed: boolean;
}

/**
 * StoryViewer 컴포넌트 Props
 * @interface StoryViewerProps
 */
interface StoryViewerProps {
  /** 스토리 그룹 목록 */
  storyGroups: StoryGroup[];
  /** 초기 그룹 인덱스 */
  initialGroupIndex?: number;
  /** 초기 스토리 인덱스 */
  initialStoryIndex?: number;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** 스토리 시청 핸들러 */
  onViewStory: (storyId: string) => void;
  /** 마지막 스토리 도달 핸들러 */
  onEndReached?: () => void;
  /** 현재 사용자 ID */
  currentUserId: string;
}

/**
 * 스토리 뷰어 컴포넌트 - 전체 화면 스토리 표시
 * @component
 * @param {StoryViewerProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 스토리 뷰어 UI
 * @description 인스타그램 스타일의 전체 화면 스토리 뷰어로 자동 재생 및 터치 제어 포함
 */
export const StoryViewer = ({
  storyGroups,
  initialGroupIndex = 0,
  initialStoryIndex = 0,
  onClose,
  onViewStory,
  onEndReached,
  currentUserId,
}: StoryViewerProps) => {
  const { t } = useAndroidSafeTranslation();
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setPaused] = useState(false);
  
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const videoRef = useRef<Video>(null);
  const storyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentGroup = storyGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];
  const isOwnStory = currentGroup?.user.id === currentUserId;

  // Story duration (5 seconds for images, actual duration for videos)
  const STORY_DURATION = 5000;

  useEffect(() => {
    if (currentStory) {
      onViewStory(currentStory.id);
      startStoryTimer();
    }

    return () => {
      if (storyTimer.current) {
        clearTimeout(storyTimer.current);
      }
    };
  }, [currentGroupIndex, currentStoryIndex]);

  /**
   * 스토리 타이머 및 진행 애니메이션 시작
   * @returns {void}
   */
  const startStoryTimer = () => {
    if (storyTimer.current) {
      clearTimeout(storyTimer.current);
    }

    progressAnimation.setValue(0);

    if (currentStory?.mediaType === 'IMAGE') {
      // For images, use fixed duration
      Animated.timing(progressAnimation, {
        toValue: 1,
        duration: STORY_DURATION,
        useNativeDriver: false,
      }).start();

      storyTimer.current = setTimeout(() => {
        nextStory();
      }, STORY_DURATION);
    }
    // For videos, duration is handled by video playback completion
  };

  /**
   * 비디오 재생 상태 핸들러
   * @param {AVPlaybackStatus} status - 비디오 재생 상태
   * @returns {void}
   */
  const handleVideoPlaybackStatus = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsLoading(false);
      
      if (status.didJustFinish) {
        nextStory();
      }

      // Update progress for video
      if (status.durationMillis && status.positionMillis) {
        const progress = status.positionMillis / status.durationMillis;
        progressAnimation.setValue(progress);
      }
    }
  };

  /**
   * 다음 스토리로 이동
   * @returns {void}
   */
  const nextStory = () => {
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      // Next story in current group
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else if (currentGroupIndex < storyGroups.length - 1) {
      // Next group
      setCurrentGroupIndex(currentGroupIndex + 1);
      setCurrentStoryIndex(0);
      flatListRef.current?.scrollToIndex({ index: currentGroupIndex + 1, animated: true });
    } else {
      // End of all stories
      if (onEndReached) {
        onEndReached();
      }
      onClose();
    }
  };

  /**
   * 이전 스토리로 이동
   * @returns {void}
   */
  const previousStory = () => {
    if (currentStoryIndex > 0) {
      // Previous story in current group
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else if (currentGroupIndex > 0) {
      // Previous group
      const prevGroup = storyGroups[currentGroupIndex - 1];
      setCurrentGroupIndex(currentGroupIndex - 1);
      setCurrentStoryIndex(prevGroup.stories.length - 1);
      flatListRef.current?.scrollToIndex({ index: currentGroupIndex - 1, animated: true });
    }
  };

  /**
   * 왼쪽/오른쪽 터치 핸들러
   * @param {'left' | 'right'} side - 터치한 쪽
   * @returns {void}
   */
  const handleTap = (side: 'left' | 'right') => {
    if (side === 'left') {
      previousStory();
    } else {
      nextStory();
    }
  };

  /**
   * 길게 누르기 핸들러 (스토리 일시정지)
   * @returns {void}
   */
  const handleLongPress = () => {
    setPaused(true);
    progressAnimation.stopAnimation();
    if (storyTimer.current) {
      clearTimeout(storyTimer.current);
    }
  };

  /**
   * 누르기 해제 핸들러 (스토리 재개)
   * @returns {void}
   */
  const handlePressOut = () => {
    setPaused(false);
    if (currentStory?.mediaType === 'IMAGE') {
      startStoryTimer();
    }
  };

  /**
   * 시간 차이 포맷팅
   * @param {string} dateString - 날짜 문자열
   * @returns {string} 포맷된 시간 차이
   */
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return t('common:time.minutesAgo', { count: diffInMinutes });
    } else if (diffInMinutes < 1440) {
      return t('common:time.hoursAgo', { count: Math.floor(diffInMinutes / 60) });
    } else {
      return t('common:time.daysAgo', { count: Math.floor(diffInMinutes / 1440) });
    }
  };

  /**
   * 진행 바 렌더링
   * @returns {JSX.Element} 진행 바 UI
   */
  const renderProgressBars = () => {
    return (
      <View className="flex-row px-2 pt-2 gap-1">
        {currentGroup.stories.map((_, index) => (
          <View key={index} className="flex-1 h-1 relative">
            <View className="absolute w-full h-full bg-white/30 rounded-sm" />
            {index < currentStoryIndex && (
              <View className="absolute w-full h-full bg-white rounded-sm" />
            )}
            {index === currentStoryIndex && (
              <Animated.View
                className="absolute h-full bg-white rounded-sm"
                style={{
                  width: progressAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                }}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  if (!currentStory) {
    return null;
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Story Content */}
      <TouchableOpacity
        activeOpacity={1}
        className="flex-1 flex-row"
        onPress={() => handleTap('right')}
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
        delayLongPress={200}
      >
        {/* Left tap area */}
        <TouchableOpacity
          className="absolute top-0 bottom-0 z-10"
          style={{ width: SCREEN_WIDTH * 0.3 }}
          onPress={() => handleTap('left')}
          activeOpacity={1}
        />

        {/* Media */}
        {currentStory.mediaType === 'IMAGE' ? (
          <Image
            source={{ uri: currentStory.mediaUrl }}
            className="w-full h-full"
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
            resizeMode="cover"
            onLoadEnd={() => setIsLoading(false)}
          />
        ) : (
          <Video
            ref={videoRef}
            source={{ uri: currentStory.mediaUrl }}
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
            resizeMode={ResizeMode.COVER}
            shouldPlay={!isPaused}
            isLooping={false}
            onPlaybackStatusUpdate={handleVideoPlaybackStatus}
          />
        )}

        {/* Loading indicator */}
        {isLoading && (
          <View className="absolute inset-0 justify-center items-center bg-black/70">
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}

        {/* Right tap area */}
        <TouchableOpacity
          className="absolute top-0 bottom-0 right-0 z-10"
          style={{ width: SCREEN_WIDTH * 0.3 }}
          onPress={() => handleTap('right')}
          activeOpacity={1}
        />
      </TouchableOpacity>

      {/* Overlay UI */}
      <SafeAreaView className="absolute inset-0 pointer-events-none">
        {/* Progress bars */}
        {renderProgressBars()}

        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-4 pointer-events-auto">
          <View className="flex-row items-center">
            {currentGroup.user.profileImage ? (
              <Image 
                source={{ uri: currentGroup.user.profileImage }} 
                className="w-10 h-10 rounded-full mr-3"
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-blue-500 justify-center items-center mr-3">
                <Text className="text-white text-sm font-semibold">
                  {currentGroup.user.nickname.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View className="justify-center">
              <Text className="text-white text-sm font-semibold">
                {currentGroup.user.nickname}
              </Text>
              <Text className="text-gray-300 text-xs">
                {formatTimeAgo(currentStory.createdAt)}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={onClose} className="p-2">
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Caption */}
        {currentStory.caption && (
          <View 
            className="absolute left-4 right-4 pointer-events-none"
            style={{ bottom: 100 }}
          >
            <Text 
              className="text-white text-sm"
              style={{
                textShadowColor: 'rgba(0, 0, 0, 0.75)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}
            >
              {currentStory.caption}
            </Text>
          </View>
        )}

        {/* View count (for own stories) */}
        {isOwnStory && currentStory.viewCount !== undefined && (
          <View 
            className="absolute left-4 flex-row items-center bg-black/50 px-3 py-2 rounded-lg"
            style={{ bottom: 40 }}
          >
            <Ionicons name="eye" size={16} color="#FFFFFF" />
            <Text className="text-white text-sm ml-2">
              {currentStory.viewCount}
            </Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};