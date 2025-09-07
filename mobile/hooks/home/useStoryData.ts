/**
 * 스토리 데이터 관리 훅
 */
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { storyService } from '@/services/storyService';
import { getStoriesByUser, StoryUser } from '@/utils/storyData';
import { SuccessStory } from '@/types/successStory';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { getAuthToken } from '@/services/api/config';

export const useStoryData = () => {
  const navigation = useNavigation() as any;
  
  // Story states
  const [stories, setStories] = useState<StoryUser[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [showAddStoryModal, setShowAddStoryModal] = useState(false);
  
  // Success Story states
  const [successStories, setSuccessStories] = useState<SuccessStory[]>([]);
  const [celebratedStories, setCelebratedStories] = useState<Set<string>>(new Set());

  /**
   * 스토리 목록 로드
   */
  const loadStories = useCallback(async () => {
    try {
      setStoriesLoading(true);
      console.log('[useStoryData] Loading stories...');
      
      // 토큰이 없으면 API 호출을 건너뜁니다 (웹 초기 로드 보호)
      const token = getAuthToken();
      console.log('[useStoryData] Current auth token:', token ? 'exists' : 'null');
      
      if (!token) {
        console.log('[useStoryData] Skip story API: no auth token loaded');
        setStories([]);
        setStoriesLoading(false);
        return;
      }

      console.log('[useStoryData] Calling getStoryGroups with token...');
      const storyGroups = await storyService.getStoryGroups();
      console.log('[useStoryData] Story groups loaded:', storyGroups.length);
      
      const storyUsers: StoryUser[] = storyGroups.map(group => ({
        id: group.userId,
        userId: group.userId,
        username: group.userName,
        profileImage: group.userAvatar,
        hasUnseenStory: group.hasUnseen,
        stories: group.stories,
      }));
      
      setStories(storyUsers);
    } catch (error) {
      console.error('[useStoryData] Failed to load stories:', error);
      setStories(getStoriesByUser());
    } finally {
      setStoriesLoading(false);
    }
  }, []);

  /**
   * 성공 스토리 목록 로드
   */
  const loadSuccessStories = useCallback(async () => {
    try {
      const storiesStr = await AsyncStorage.getItem('success-stories');
      if (storiesStr) {
        const stories = JSON.parse(storiesStr) as SuccessStory[];
        setSuccessStories(stories.slice(0, 5)); // 최근 5개만 표시
        
        // 축하한 스토리 ID 로드
        const celebratedStr = await AsyncStorage.getItem('celebrated-stories');
        if (celebratedStr) {
          setCelebratedStories(new Set(JSON.parse(celebratedStr)));
        }
      }
    } catch (error) {
      console.error('[useStoryData] Failed to load success stories:', error);
    }
  }, []);

  /**
   * 성공 스토리 축하 토글
   */
  const handleToggleCelebration = useCallback(async (storyId: string) => {
    try {
      const newCelebrated = new Set(celebratedStories);
      const wasCelebrated = newCelebrated.has(storyId);
      
      if (wasCelebrated) {
        newCelebrated.delete(storyId);
      } else {
        newCelebrated.add(storyId);
      }
      
      setCelebratedStories(newCelebrated);
      await AsyncStorage.setItem('celebrated-stories', JSON.stringify(Array.from(newCelebrated)));
      
      // 성공 스토리 카운트 업데이트
      setSuccessStories(prev => prev.map(story => {
        if (story.id === storyId) {
          return {
            ...story,
            celebrationCount: wasCelebrated 
              ? Math.max(0, story.celebrationCount - 1)
              : story.celebrationCount + 1
          };
        }
        return story;
      }));
      
      // 스토리 업데이트를 AsyncStorage에도 반영
      const storiesStr = await AsyncStorage.getItem('success-stories');
      if (storiesStr) {
        const allStories = JSON.parse(storiesStr) as SuccessStory[];
        const updatedStories = allStories.map(story => {
          if (story.id === storyId) {
            return {
              ...story,
              celebrationCount: wasCelebrated 
                ? Math.max(0, story.celebrationCount - 1)
                : story.celebrationCount + 1
            };
          }
          return story;
        });
        await AsyncStorage.setItem('success-stories', JSON.stringify(updatedStories));
      }
    } catch (error) {
      console.error('[useStoryData] Failed to toggle celebration:', error);
    }
  }, [celebratedStories]);

  /**
   * 스토리 프레스 핸들러
   */
  const handleStoryPress = useCallback((index: number) => {
    console.log('[useStoryData] Story pressed:', index);
    
    if (index === -1) {
      handleAddStoryPress();
    } else {
      setSelectedStoryIndex(index);
      setShowStoryViewer(true);
    }
  }, []);

  /**
   * 스토리 추가 핸들러
   */
  const handleAddStoryPress = useCallback(() => {
    console.log('[useStoryData] Add story pressed');
    setShowAddStoryModal(true);
  }, []);

  /**
   * 스토리 업로드 핸들러
   */
  const handleStoryUpload = useCallback(async (imageUri: string, caption?: string) => {
    console.log('[useStoryData] Uploading story:', { imageUri, caption });
    
    try {
      // TODO: 실제 API 호출로 교체
      // await storyService.uploadStory(imageUri, caption);
      
      // 업로드 성공 시 스토리 목록 새로고침
      await loadStories();
      
      console.log('[useStoryData] Story uploaded successfully');
    } catch (error) {
      console.error('[useStoryData] Failed to upload story:', error);
      throw error;
    }
  }, [loadStories]);

  return {
    stories,
    storiesLoading,
    showStoryViewer,
    selectedStoryIndex,
    setShowStoryViewer,
    showAddStoryModal,
    setShowAddStoryModal,
    successStories,
    celebratedStories,
    loadStories,
    loadSuccessStories,
    handleToggleCelebration,
    handleStoryPress,
    handleAddStoryPress,
    handleStoryUpload,
  };
};