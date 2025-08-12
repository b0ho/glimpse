/**
 * 스토리 데이터 관리 유틸리티
 * @module utils/storyData
 * @description AsyncStorage를 사용한 스토리 데이터 저장/조회
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Story {
  id: string;
  userId: string;
  authorNickname: string;
  imageUri: string;
  createdAt: string;
  viewedBy: string[]; // 조회한 사용자 ID 목록
  isViewed?: boolean; // 현재 사용자가 조회했는지 여부
}

export interface StoryUser {
  userId: string;
  nickname: string;
  stories: Story[];
  hasUnviewedStories: boolean;
}

const STORY_STORAGE_KEY = 'user_stories';

/**
 * 새 스토리 저장
 * @param story 저장할 스토리 데이터
 */
export const saveStory = async (story: Omit<Story, 'id' | 'createdAt' | 'viewedBy'>): Promise<Story> => {
  try {
    const newStory: Story = {
      ...story,
      id: `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      viewedBy: [story.userId], // 작성자는 자동으로 조회함
    };

    const existingStories = await getAllStories();
    const updatedStories = [newStory, ...existingStories];
    
    await AsyncStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(updatedStories));
    console.log('[StoryData] 스토리 저장 완료:', newStory.id);
    
    return newStory;
  } catch (error) {
    console.error('[StoryData] 스토리 저장 실패:', error);
    throw error;
  }
};

/**
 * 모든 스토리 조회
 */
export const getAllStories = async (): Promise<Story[]> => {
  try {
    const storiesJson = await AsyncStorage.getItem(STORY_STORAGE_KEY);
    if (!storiesJson) return [];
    
    const stories: Story[] = JSON.parse(storiesJson);
    
    // 24시간 이상 지난 스토리 자동 삭제
    const now = new Date();
    const validStories = stories.filter(story => {
      const storyDate = new Date(story.createdAt);
      const diffHours = (now.getTime() - storyDate.getTime()) / (1000 * 60 * 60);
      return diffHours < 24;
    });
    
    // 삭제된 스토리가 있으면 업데이트
    if (validStories.length !== stories.length) {
      await AsyncStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(validStories));
      console.log('[StoryData] 만료된 스토리 자동 삭제:', stories.length - validStories.length, '개');
    }
    
    return validStories;
  } catch (error) {
    console.error('[StoryData] 스토리 조회 실패:', error);
    return [];
  }
};

/**
 * 사용자별 스토리 그룹화
 * @param currentUserId 현재 사용자 ID (조회 여부 판단용)
 */
export const getStoriesByUser = async (currentUserId: string): Promise<StoryUser[]> => {
  try {
    const allStories = await getAllStories();
    
    // 사용자별로 그룹화
    const storyMap = new Map<string, StoryUser>();
    
    allStories.forEach(story => {
      const userId = story.userId;
      
      if (!storyMap.has(userId)) {
        storyMap.set(userId, {
          userId,
          nickname: story.authorNickname,
          stories: [],
          hasUnviewedStories: false,
        });
      }
      
      const storyUser = storyMap.get(userId)!;
      
      // 현재 사용자가 조회했는지 확인
      const isViewed = story.viewedBy.includes(currentUserId);
      const storyWithViewStatus = { ...story, isViewed };
      
      storyUser.stories.push(storyWithViewStatus);
      
      // 미조회 스토리가 있는지 확인
      if (!isViewed && userId !== currentUserId) {
        storyUser.hasUnviewedStories = true;
      }
    });
    
    // 배열로 변환하고 최신 스토리 순으로 정렬
    const storyUsers = Array.from(storyMap.values()).map(storyUser => ({
      ...storyUser,
      stories: storyUser.stories.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    }));
    
    // 미조회 스토리가 있는 사용자를 먼저, 그 다음 최신 스토리 순으로 정렬
    storyUsers.sort((a, b) => {
      // 미조회 스토리 우선
      if (a.hasUnviewedStories && !b.hasUnviewedStories) return -1;
      if (!a.hasUnviewedStories && b.hasUnviewedStories) return 1;
      
      // 둘 다 같은 상태면 최신 스토리 순
      const aLatest = a.stories[0]?.createdAt || '';
      const bLatest = b.stories[0]?.createdAt || '';
      return new Date(bLatest).getTime() - new Date(aLatest).getTime();
    });
    
    return storyUsers;
  } catch (error) {
    console.error('[StoryData] 사용자별 스토리 조회 실패:', error);
    return [];
  }
};

/**
 * 스토리 조회 표시
 * @param storyId 스토리 ID
 * @param userId 조회한 사용자 ID
 */
export const markStoryAsViewed = async (storyId: string, userId: string): Promise<void> => {
  try {
    const allStories = await getAllStories();
    const updatedStories = allStories.map(story => {
      if (story.id === storyId && !story.viewedBy.includes(userId)) {
        return {
          ...story,
          viewedBy: [...story.viewedBy, userId],
        };
      }
      return story;
    });
    
    await AsyncStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(updatedStories));
    console.log('[StoryData] 스토리 조회 표시 완료:', storyId);
  } catch (error) {
    console.error('[StoryData] 스토리 조회 표시 실패:', error);
    throw error;
  }
};

/**
 * 특정 사용자의 스토리 삭제
 * @param storyId 삭제할 스토리 ID
 * @param userId 삭제 요청 사용자 ID (본인 확인용)
 */
export const deleteStory = async (storyId: string, userId: string): Promise<void> => {
  try {
    const allStories = await getAllStories();
    const storyToDelete = allStories.find(story => story.id === storyId);
    
    if (!storyToDelete) {
      throw new Error('삭제할 스토리를 찾을 수 없습니다.');
    }
    
    if (storyToDelete.userId !== userId) {
      throw new Error('본인의 스토리만 삭제할 수 있습니다.');
    }
    
    const updatedStories = allStories.filter(story => story.id !== storyId);
    await AsyncStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(updatedStories));
    
    console.log('[StoryData] 스토리 삭제 완료:', storyId);
  } catch (error) {
    console.error('[StoryData] 스토리 삭제 실패:', error);
    throw error;
  }
};