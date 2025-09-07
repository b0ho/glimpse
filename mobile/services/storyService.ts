import { API_BASE_URL, getAuthToken } from './api/config';
// import { authService } from './auth/auth-service'; // TODO: Implement token handling

/**
 * 스토리 인터페이스
 * @interface Story
 * @description 24시간 후 사라지는 임시 콘텐츠 정보
 */
export interface Story {
  /** 스토리 ID */
  id: string;
  /** 작성자 ID */
  userId: string;
  /** 미디어 URL */
  mediaUrl: string;
  /** 미디어 타입 */
  mediaType: 'IMAGE' | 'VIDEO';
  /** 캡션 */
  caption?: string;
  /** 활성화 상태 */
  isActive: boolean;
  /** 만료 시간 */
  expiresAt: string;
  /** 생성 시간 */
  createdAt: string;
  /** 수정 시간 */
  updatedAt: string;
  /** 작성자 정보 */
  user: {
    /** 사용자 ID */
    id: string;
    /** 닉네임 */
    nickname: string;
    /** 프로필 이미지 */
    profileImage?: string;
  };
  /** 통계 정보 */
  _count?: {
    /** 조회수 */
    views: number;
  };
  /** 조회자 목록 */
  views?: Array<{ id: string }>;
  /** 조회 여부 */
  isViewed?: boolean;
  /** 본인 스토리 여부 */
  isOwner?: boolean;
}

/**
 * 스토리 그룹 인터페이스
 * @interface StoryGroup
 * @description 사용자별로 그룹화된 스토리 정보
 */
export interface StoryGroup {
  /** 사용자 ID */
  userId: string;
  /** 사용자 이름 */
  userName: string;
  /** 사용자 아바타 */
  userAvatar?: string;
  /** 스토리 목록 */
  stories: Story[];
  /** 미조회 스토리 존재 여부 */
  hasUnseen: boolean;
}

/**
 * 스토리 서비스 클래스
 * @class StoryService
 * @description 24시간 임시 콘텐츠 관리 (인스타그램 스토리 유사 기능)
 */
class StoryService {
  /**
   * 새 스토리 생성
   * @async
   * @param {string} mediaUri - 미디어 파일 URI
   * @param {'image' | 'video'} mediaType - 미디어 타입
   * @param {string} [caption] - 스토리 캡션
   * @returns {Promise<Story>} 생성된 스토리 정보
   * @throws {Error} 업로드 실패 시
   * @description 이미지나 비디오를 스토리로 업로드 (24시간 후 자동 삭제)
   */
  async createStory(mediaUri: string, mediaType: 'image' | 'video', caption?: string): Promise<Story> {
    try {
      // Get token from Clerk (set via setAuthToken in api/config)
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token');
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
        throw new Error(error.message || 'Story upload failed');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to create story:', error);
      throw error;
    }
  }

  /**
   * 내 스토리 목록 조회
   * @async
   * @returns {Promise<Story[]>} 내 스토리 목록
   * @throws {Error} 조회 실패 시
   * @description 현재 활성화된 내 스토리 목록을 가져오기
   */
  async getMyStories(): Promise<Story[]> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_BASE_URL}/stories/my`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get my stories:', error);
      throw error;
    }
  }

  /**
   * 스토리 그룹 조회
   * @async
   * @returns {Promise<StoryGroup[]>} 스토리 그룹 목록
   * @throws {Error} 조회 실패 시
   * @description 매칭된 사용자들의 스토리를 그룹화하여 조회
   */
  async getStoryGroups(): Promise<StoryGroup[]> {
    try {
      // 개발 환경에서는 더미 데이터 반환
      if (__DEV__) {
        return [
          {
            userId: 'user1',
            userName: '커피러버',
            userAvatar: undefined,
            stories: [],
            hasUnseen: false,
          },
          {
            userId: 'user2',
            userName: '개발자',
            userAvatar: undefined,
            stories: [],
            hasUnseen: true,
          },
        ];
      }

      const token = getAuthToken();
      if (!token) {
        // 비로그인 시 조용히 빈 목록 반환 (웹 초기 로드용)
        return [];
      }

      const response = await fetch(`${API_BASE_URL}/stories/groups`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.log('Failed to get story groups (non-fatal):', (error as any)?.message || error);
      return [];
    }
  }

  /**
   * 스토리 피드 조회
   * @async
   * @param {number} [page=1] - 페이지 번호
   * @param {number} [limit=20] - 페이지당 항목 수
   * @returns {Promise<StoryGroup[]>} 스토리 그룹 목록
   * @throws {Error} 조회 실패 시
   * @description 매칭된 사용자들의 스토리를 그룹화하여 피드 형태로 조회
   */
  async getStoriesFeed(page: number = 1, limit: number = 20): Promise<StoryGroup[]> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token');
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
        throw new Error('Failed to fetch story feed');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get stories feed:', error);
      throw error;
    }
  }

  /**
   * 특정 스토리 조회
   * @async
   * @param {string} storyId - 스토리 ID
   * @returns {Promise<Story>} 스토리 정보
   * @throws {Error} 조회 실패 시
   * @description ID로 특정 스토리의 상세 정보 조회
   */
  async getStoryById(storyId: string): Promise<Story> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_BASE_URL}/stories/${storyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch story');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get story:', error);
      throw error;
    }
  }

  /**
   * 스토리 조회 기록
   * @async
   * @param {string} storyId - 스토리 ID
   * @returns {Promise<void>}
   * @description 스토리를 조회했음을 서버에 기록 (조회수 증가)
   */
  async viewStory(storyId: string): Promise<void> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token');
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

  /**
   * 스토리 조회자 목록 조회
   * @async
   * @param {string} storyId - 스토리 ID
   * @returns {Promise<any[]>} 조회자 목록
   * @throws {Error} 조회 실패 시
   * @description 내 스토리를 본 사용자 목록 조회 (프리미엄 기능)
   */
  async getStoryViewers(storyId: string): Promise<any[]> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_BASE_URL}/stories/${storyId}/viewers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch viewers');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get story viewers:', error);
      throw error;
    }
  }

  /**
   * 스토리 삭제
   * @async
   * @param {string} storyId - 삭제할 스토리 ID
   * @returns {Promise<void>}
   * @throws {Error} 삭제 실패 시
   * @description 내 스토리를 수동으로 삭제
   */
  async deleteStory(storyId: string): Promise<void> {
    try {
      // TODO: Get token from Clerk
      const token = '';
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_BASE_URL}/stories/${storyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete story');
      }
    } catch (error) {
      console.error('Failed to delete story:', error);
      throw error;
    }
  }

  /**
   * 특정 사용자의 스토리 조회
   * @async
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Story[]>} 사용자의 스토리 목록
   * @throws {Error} 조회 실패 시
   * @description 특정 사용자의 활성화된 스토리 목록 조회
   */
  async getUserStories(userId: string): Promise<Story[]> {
    try {
      // TODO: Get token from Clerk
      const token = '';
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_BASE_URL}/stories/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user stories');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get user stories:', error);
      throw error;
    }
  }
}

/**
 * 스토리 서비스 싱글톤 인스턴스
 * @constant {StoryService}
 * @description 앱 전체에서 사용할 스토리 서비스 인스턴스
 */
export const storyService = new StoryService();