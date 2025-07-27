import { API_BASE_URL } from './api/config';
// import { authService } from './auth/auth-service'; // TODO: Implement token handling

export interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  caption?: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    nickname: string;
    profileImage?: string;
  };
  _count?: {
    views: number;
  };
  views?: Array<{ id: string }>;
  isViewed?: boolean;
  isOwner?: boolean;
}

export interface StoryGroup {
  user: {
    id: string;
    nickname: string;
    profileImage?: string;
  };
  stories: Story[];
  hasUnviewed: boolean;
}

class StoryService {
  // Create a new story
  async createStory(mediaUri: string, mediaType: 'image' | 'video', caption?: string): Promise<Story> {
    try {
      // TODO: Get token from Clerk
      const token = '';
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const formData = new FormData();
      formData.append('media', {
        uri: mediaUri,
        type: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
        name: mediaType === 'video' ? 'story.mp4' : 'story.jpg',
      } as any);

      if (caption) {
        formData.append('caption', caption);
      }

      const response = await fetch(`${API_BASE_URL}/stories`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '스토리 업로드 실패');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to create story:', error);
      throw error;
    }
  }

  // Get my stories
  async getMyStories(): Promise<Story[]> {
    try {
      // TODO: Get token from Clerk
      const token = '';
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch(`${API_BASE_URL}/stories/my`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('스토리 목록을 가져올 수 없습니다.');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get my stories:', error);
      throw error;
    }
  }

  // Get stories feed from matched users
  async getStoriesFeed(page: number = 1, limit: number = 20): Promise<StoryGroup[]> {
    try {
      // TODO: Get token from Clerk
      const token = '';
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch(
        `${API_BASE_URL}/stories/feed?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('스토리 피드를 가져올 수 없습니다.');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get stories feed:', error);
      throw error;
    }
  }

  // Get a specific story
  async getStoryById(storyId: string): Promise<Story> {
    try {
      // TODO: Get token from Clerk
      const token = '';
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch(`${API_BASE_URL}/stories/${storyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('스토리를 가져올 수 없습니다.');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get story:', error);
      throw error;
    }
  }

  // View a story
  async viewStory(storyId: string): Promise<void> {
    try {
      // TODO: Get token from Clerk
      const token = '';
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch(`${API_BASE_URL}/stories/${storyId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to mark story as viewed');
      }
    } catch (error) {
      console.error('Failed to view story:', error);
    }
  }

  // Get story viewers
  async getStoryViewers(storyId: string): Promise<any[]> {
    try {
      // TODO: Get token from Clerk
      const token = '';
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch(`${API_BASE_URL}/stories/${storyId}/viewers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('조회자 목록을 가져올 수 없습니다.');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get story viewers:', error);
      throw error;
    }
  }

  // Delete a story
  async deleteStory(storyId: string): Promise<void> {
    try {
      // TODO: Get token from Clerk
      const token = '';
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch(`${API_BASE_URL}/stories/${storyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('스토리 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete story:', error);
      throw error;
    }
  }

  // Get stories from a specific user
  async getUserStories(userId: string): Promise<Story[]> {
    try {
      // TODO: Get token from Clerk
      const token = '';
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch(`${API_BASE_URL}/stories/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('사용자 스토리를 가져올 수 없습니다.');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get user stories:', error);
      throw error;
    }
  }
}

export const storyService = new StoryService();