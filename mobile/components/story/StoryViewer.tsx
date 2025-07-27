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
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Story {
  id: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  caption?: string;
  createdAt: string;
  viewCount?: number;
  user: {
    id: string;
    nickname: string;
    profileImage?: string;
  };
  isViewed?: boolean;
}

interface StoryGroup {
  user: {
    id: string;
    nickname: string;
    profileImage?: string;
  };
  stories: Story[];
  hasUnviewed: boolean;
}

interface StoryViewerProps {
  storyGroups: StoryGroup[];
  initialGroupIndex?: number;
  initialStoryIndex?: number;
  onClose: () => void;
  onViewStory: (storyId: string) => void;
  onEndReached?: () => void;
  currentUserId: string;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  storyGroups,
  initialGroupIndex = 0,
  initialStoryIndex = 0,
  onClose,
  onViewStory,
  onEndReached,
  currentUserId,
}) => {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setPaused] = useState(false);
  
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const videoRef = useRef<Video>(null);
  const storyTimer = useRef<NodeJS.Timeout | null>(null);

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

  // Start story timer and progress animation
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

  // Handle video playback status
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

  // Navigate to next story
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

  // Navigate to previous story
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

  // Handle tap on left/right side
  const handleTap = (side: 'left' | 'right') => {
    if (side === 'left') {
      previousStory();
    } else {
      nextStory();
    }
  };

  // Handle long press (pause story)
  const handleLongPress = () => {
    setPaused(true);
    progressAnimation.stopAnimation();
    if (storyTimer.current) {
      clearTimeout(storyTimer.current);
    }
  };

  // Handle press out (resume story)
  const handlePressOut = () => {
    setPaused(false);
    if (currentStory?.mediaType === 'IMAGE') {
      startStoryTimer();
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}시간 전`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}일 전`;
    }
  };

  // Render progress bars
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