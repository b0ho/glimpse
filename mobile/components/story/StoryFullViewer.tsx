import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  StatusBar,
  Alert,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { StoryUser, Story, markStoryAsViewed } from '@/utils/storyData';
import { formatTimeAgo } from '@/utils/dateUtils';

const { width, height } = Dimensions.get('window');

interface StoryFullViewerProps {
  /** 스토리 사용자 목록 */
  storyUsers: StoryUser[];
  /** 현재 표시중인 사용자 인덱스 */
  currentUserIndex: number;
  /** 현재 사용자 ID */
  currentUserId: string;
  /** 모달 표시 여부 */
  visible: boolean;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** 스토리 새로고침 핸들러 */
  onRefresh?: () => void;
}

/**
 * 스토리 전체화면 뷰어 - 인스타그램 스타일
 * @component
 * @param {StoryFullViewerProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 스토리 뷰어 UI
 */
export const StoryFullViewer: React.FC<StoryFullViewerProps> = ({
  storyUsers,
  currentUserIndex,
  currentUserId,
  visible,
  onClose,
  onRefresh,
}) => {
  const { t } = useAndroidSafeTranslation();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [userIndex, setUserIndex] = useState(currentUserIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // 현재 표시중인 스토리 사용자와 스토리
  const currentUser = storyUsers?.[userIndex];
  const currentStory = currentUser?.stories?.[currentStoryIndex];

  // 스토리 자동 진행 (5초)
  useEffect(() => {
    if (!visible || !currentStory || isPaused) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + 2; // 5초 = 100/2 = 50틱
      });
    }, 100);

    return () => clearInterval(interval);
  }, [visible, currentStory, isPaused, userIndex, currentStoryIndex]);

  // 스토리 조회 표시
  useEffect(() => {
    if (currentStory && currentUserId !== currentStory.userId) {
      markStoryAsViewed(currentStory.id, currentUserId).catch(console.error);
    }
  }, [currentStory, currentUserId]);

  // 다음 스토리로 이동
  const handleNextStory = () => {
    if (!currentUser) {
      onClose();
      return;
    }

    if (currentStoryIndex < (currentUser.stories?.length || 0) - 1) {
      // 같은 사용자의 다음 스토리
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      // 다음 사용자의 첫 번째 스토리
      if (userIndex < storyUsers.length - 1) {
        setUserIndex(prev => prev + 1);
        setCurrentStoryIndex(0);
        setProgress(0);
      } else {
        // 모든 스토리 완료
        onClose();
      }
    }
  };

  // 이전 스토리로 이동
  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      // 같은 사용자의 이전 스토리
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else {
      // 이전 사용자의 마지막 스토리
      if (userIndex > 0) {
        const prevUserIndex = userIndex - 1;
        const prevUser = storyUsers[prevUserIndex];
        setUserIndex(prevUserIndex);
        setCurrentStoryIndex((prevUser?.stories?.length || 1) - 1);
        setProgress(0);
      } else {
        // 첫 번째 스토리
        setProgress(0);
      }
    }
  };

  // 모달 초기화
  const handleModalShow = () => {
    setUserIndex(currentUserIndex);
    setCurrentStoryIndex(0);
    setProgress(0);
    setIsPaused(false);
  };

  if (!visible || !currentUser || !currentStory) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onShow={handleModalShow}
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <View style={styles.container}>
        {/* 배경 이미지 */}
        <Image
          source={{ uri: currentStory.imageUri }}
          style={styles.storyImage}
          resizeMode="cover"
        />

        {/* 그라데이션 오버레이 */}
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.5)']}
          style={styles.overlay}
        />

        {/* 상단 프로그레스 바 */}
        <View style={styles.progressContainer}>
          {currentUser.stories?.map((_, index) => (
            <View key={index} style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${
                      index < currentStoryIndex
                        ? 100
                        : index === currentStoryIndex
                        ? progress
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>
          )) || null}
        </View>

        {/* 상단 헤더 */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {currentUser.nickname.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.username}>{currentUser.nickname}</Text>
              <Text style={styles.timeText}>
                {formatTimeAgo(currentStory.createdAt)}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color={COLORS.TEXT.WHITE} />
          </TouchableOpacity>
        </View>

        {/* 터치 영역 */}
        <View style={styles.touchArea}>
          <TouchableOpacity
            style={styles.leftTouch}
            onPress={handlePrevStory}
            activeOpacity={1}
          />
          <TouchableOpacity
            style={styles.centerTouch}
            onPress={() => setIsPaused(!isPaused)}
            activeOpacity={1}
          />
          <TouchableOpacity
            style={styles.rightTouch}
            onPress={handleNextStory}
            activeOpacity={1}
          />
        </View>

        {/* 일시정지 표시 */}
        {isPaused && (
          <View style={styles.pausedIndicator}>
            <Icon name="pause" size={48} color={COLORS.TEXT.WHITE} />
          </View>
        )}

        {/* 하단 정보 */}
        <View style={styles.bottomInfo}>
          <Text style={styles.storyCounter}>
            {currentStoryIndex + 1} / {currentUser.stories.length}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

interface Styles {
  container: ViewStyle;
  storyImage: ImageStyle;
  overlay: ViewStyle;
  progressContainer: ViewStyle;
  progressBarBackground: ViewStyle;
  progressBarFill: ViewStyle;
  header: ViewStyle;
  userInfo: ViewStyle;
  avatar: ViewStyle;
  avatarText: TextStyle;
  userDetails: ViewStyle;
  username: TextStyle;
  timeText: TextStyle;
  closeButton: ViewStyle;
  touchArea: ViewStyle;
  leftTouch: ViewStyle;
  centerTouch: ViewStyle;
  rightTouch: ViewStyle;
  pausedIndicator: ViewStyle;
  bottomInfo: ViewStyle;
  storyCounter: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  storyImage: {
    width: width,
    height: height,
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.SM,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + SPACING.SM : SPACING.XL,
    gap: 2,
  },
  progressBarBackground: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
  },
  progressBarFill: {
    height: 2,
    backgroundColor: COLORS.TEXT.WHITE,
    borderRadius: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.SM,
  },
  avatarText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
  },
  timeText: {
    fontSize: FONT_SIZES.XS,
    color: 'rgba(255,255,255,0.8)',
  },
  closeButton: {
    padding: SPACING.SM,
  },
  touchArea: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    top: 100, // 헤더 영역 제외
  },
  leftTouch: {
    flex: 1,
  },
  centerTouch: {
    flex: 1,
  },
  rightTouch: {
    flex: 1,
  },
  pausedIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: SPACING.XL,
    left: SPACING.MD,
    right: SPACING.MD,
    alignItems: 'center',
  },
  storyCounter: {
    fontSize: FONT_SIZES.SM,
    color: 'rgba(255,255,255,0.8)',
  },
});