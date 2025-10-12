import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { StoryUser, Story, markStoryAsViewed } from '@/utils/storyData';
import { formatTimeAgo } from '@/utils/dateUtils';
import { cn } from '@/utils/cn';

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
      <View className="flex-1 bg-black">
        {/* 배경 이미지 */}
        <Image
          source={{ uri: currentStory.imageUri }}
          className="absolute w-full h-full"
          style={{ width, height }}
          resizeMode="cover"
        />

        {/* 그라데이션 오버레이 */}
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.5)']}
          className="absolute inset-0"
        />

        {/* 상단 프로그레스 바 */}
        <View className="flex-row px-2 gap-1" style={{ paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 32 }}>
          {currentUser.stories?.map((_, index) => (
            <View key={index} className="flex-1 h-1 bg-white/30 rounded-sm">
              <View
                className="h-1 bg-white rounded-sm"
                style={{
                  width: `${
                    index < currentStoryIndex
                      ? 100
                      : index === currentStoryIndex
                      ? progress
                      : 0
                  }%`,
                }}
              />
            </View>
          )) || null}
        </View>

        {/* 상단 헤더 */}
        <View className="flex-row items-center justify-between px-4 py-2">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-blue-500 justify-center items-center mr-2">
              <Text className="text-base font-bold text-white">
                {currentUser.nickname.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-white">
                {currentUser.nickname}
              </Text>
              <Text className="text-xs text-white/80">
                {formatTimeAgo(currentStory.createdAt)}
              </Text>
            </View>
          </View>
          <TouchableOpacity className="p-2" onPress={onClose}>
            <Icon name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 터치 영역 */}
        <View className="absolute inset-0 flex-row" style={{ top: 100 }}>
          <TouchableOpacity
            className="flex-1"
            onPress={handlePrevStory}
            activeOpacity={1}
          />
          <TouchableOpacity
            className="flex-1"
            onPress={() => setIsPaused(!isPaused)}
            activeOpacity={1}
          />
          <TouchableOpacity
            className="flex-1"
            onPress={handleNextStory}
            activeOpacity={1}
          />
        </View>

        {/* 일시정지 표시 */}
        {isPaused && (
          <View 
            className="absolute w-12 h-12 bg-black/50 rounded-full justify-center items-center"
            style={{ 
              top: '50%', 
              left: '50%', 
              transform: [{ translateX: -24 }, { translateY: -24 }] 
            }}
          >
            <Icon name="pause" size={48} color="#FFFFFF" />
          </View>
        )}

        {/* 하단 정보 */}
        <View className="absolute bottom-8 left-4 right-4 items-center">
          <Text className="text-sm text-white/80">
            {currentStoryIndex + 1} / {currentUser.stories.length}
          </Text>
        </View>
      </View>
    </Modal>
  );
};