import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Animated,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { AVPlaybackStatus } from 'expo-audio';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

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
  /** 캐픍션 */
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
export const StoryViewer= ({
  storyGroups,
  initialGroupIndex = 0,
  initialStoryIndex = 0,
  onClose,
  onViewStory,
  onEndReached,
  currentUserId,
}) => {
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
      <View style={styles.progressContainer}>
        {currentGroup.stories.map((_, index) => (
          <View key={index} style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground} />
            {index < currentStoryIndex && (
              <View style={[styles.progressBarFill, { width: '100%' }]} />
            )}
            {index === currentStoryIndex && (
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Story Content */}
      <TouchableOpacity
        activeOpacity={1}
        style={styles.storyContainer}
        onPress={() => handleTap('right')}
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
        delayLongPress={200}
      >
        {/* Left tap area */}
        <TouchableOpacity
          style={styles.tapArea}
          onPress={() => handleTap('left')}
          activeOpacity={1}
        />

        {/* Media */}
        {currentStory.mediaType === 'IMAGE' ? (
          <Image
            source={{ uri: currentStory.mediaUrl }}
            style={styles.media}
            resizeMode="cover"
            onLoadEnd={() => setIsLoading(false)}
          />
        ) : (
          <Video
            ref={videoRef}
            source={{ uri: currentStory.mediaUrl }}
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            shouldPlay={!isPaused}
            isLooping={false}
            onPlaybackStatusUpdate={handleVideoPlaybackStatus}
          />
        )}

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.white} />
          </View>
        )}

        {/* Right tap area */}
        <TouchableOpacity
          style={styles.tapArea}
          onPress={() => handleTap('right')}
          activeOpacity={1}
        />
      </TouchableOpacity>

      {/* Overlay UI */}
      <SafeAreaView style={styles.overlay}>
        {/* Progress bars */}
        {renderProgressBars()}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            {currentGroup.user.profileImage ? (
              <Image source={{ uri: currentGroup.user.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImageText}>
                  {currentGroup.user.nickname.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.userTextInfo}>
              <Text style={styles.nickname}>{currentGroup.user.nickname}</Text>
              <Text style={styles.timeAgo}>{formatTimeAgo(currentStory.createdAt)}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Caption */}
        {currentStory.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>{currentStory.caption}</Text>
          </View>
        )}

        {/* View count (for own stories) */}
        {isOwnStory && currentStory.viewCount !== undefined && (
          <View style={styles.viewCountContainer}>
            <Ionicons name="eye" size={16} color={COLORS.white} />
            <Text style={styles.viewCount}>{currentStory.viewCount}</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  storyContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  tapArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.3,
    zIndex: 1,
  },
  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.base,
    paddingTop: SIZES.base,
    gap: 4,
  },
  progressBarContainer: {
    flex: 1,
    height: 3,
    position: 'relative',
  },
  progressBarBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressBarFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SIZES.base,
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.base,
  },
  profileImageText: {
    ...FONTS.body3,
    color: COLORS.white,
    fontWeight: '600',
  },
  userTextInfo: {
    justifyContent: 'center',
  },
  nickname: {
    ...FONTS.body3,
    color: COLORS.white,
    fontWeight: '600',
  },
  timeAgo: {
    ...FONTS.body5,
    color: COLORS.lightGray,
  },
  closeButton: {
    padding: SIZES.base,
  },
  captionContainer: {
    position: 'absolute',
    bottom: 100,
    left: SIZES.padding,
    right: SIZES.padding,
  },
  caption: {
    ...FONTS.body3,
    color: COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  viewCountContainer: {
    position: 'absolute',
    bottom: 40,
    left: SIZES.padding,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius,
  },
  viewCount: {
    ...FONTS.body4,
    color: COLORS.white,
    marginLeft: SIZES.base,
  },
});