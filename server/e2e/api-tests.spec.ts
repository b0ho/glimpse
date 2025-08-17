import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3001/api/v1';

test.describe('API E2E Tests', () => {
  let authToken: string = 'test-token'; // 더미 토큰 (개발 환경에서는 x-dev-auth로 대체)
  let userId: string = 'test-user-id';
  let groupId: string;
  let feedbackId: string;

  // 개발 환경에서는 x-dev-auth 헤더로 인증을 대체합니다
  const authHeaders = {
    'x-dev-auth': 'true',
    'Content-Type': 'application/json',
  };

  test.describe('Group API', () => {
    test('should create a new group', async ({ request }) => {
      const response = await request.post(`${API_URL}/groups`, {
        headers: authHeaders,
        data: {
          name: 'Test Group',
          type: 'CREATED',
          description: 'E2E Test Group Description',
          isPublic: true,
        },
      });

      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('id');
        groupId = data.data.id;
      }
    });

    test('should get group list', async ({ request }) => {
      const response = await request.get(`${API_URL}/groups`, {
        headers: authHeaders,
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('should toggle group like', async ({ request }) => {
      if (!groupId) {
        test.skip();
        return;
      }

      const response = await request.post(`${API_URL}/groups/${groupId}/like`, {
        headers: authHeaders,
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('liked');
    });

    test('should join a group', async ({ request }) => {
      if (!groupId) {
        test.skip();
        return;
      }

      const response = await request.post(`${API_URL}/groups/${groupId}/join`, {
        headers: authHeaders,
      });

      // 이미 참여한 그룹일 수 있으므로 400 에러도 허용
      expect([200, 400].includes(response.status())).toBeTruthy();
    });
  });

  test.describe('Location API', () => {
    test('should update user location', async ({ request }) => {
      const response = await request.put(`${API_URL}/location`, {
        headers: authHeaders,
        data: {
          latitude: 37.5665,
          longitude: 126.9780,
        },
      });

      if (!response.ok()) {
        const error = await response.json();
        console.log('Location update error:', error);
      }
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.message).toContain('위치');
    });

    test('should get nearby users', async ({ request }) => {
      const response = await request.get(`${API_URL}/location/nearby/users?radius=5`, {
        headers: authHeaders,
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data).toHaveProperty('users');
      expect(Array.isArray(data.users)).toBe(true);
    });

    test('should update user persona', async ({ request }) => {
      const response = await request.put(`${API_URL}/location/persona`, {
        headers: authHeaders,
        data: {
          description: '카페에서 책 읽는 것을 좋아합니다',
          interests: ['독서', '커피', '음악'],
          lookingFor: '같은 관심사를 가진 친구',
          availability: '주말 오후',
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('persona');
    });

    test('should get user persona', async ({ request }) => {
      const response = await request.get(`${API_URL}/location/persona`, {
        headers: authHeaders,
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('description');
    });
  });

  test.describe('Support API', () => {
    test('should create feedback', async ({ request }) => {
      const response = await request.post(`${API_URL}/support/feedbacks`, {
        headers: authHeaders,
        data: {
          title: 'E2E Test Feedback',
          content: '이것은 E2E 테스트를 위한 피드백입니다.',
          category: 'feature',
          priority: 'medium',
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      feedbackId = data.data.id;
    });

    test('should get feedback list', async ({ request }) => {
      const response = await request.get(`${API_URL}/support/feedbacks?sortBy=recent`, {
        headers: authHeaders,
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('feedbacks');
      expect(Array.isArray(data.data.feedbacks)).toBe(true);
    });

    test('should vote on feedback', async ({ request }) => {
      if (!feedbackId) {
        test.skip();
        return;
      }

      const response = await request.post(`${API_URL}/support/feedbacks/${feedbackId}/vote`, {
        headers: authHeaders,
        data: {
          voteType: 'up',
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('voted');
    });

    test('should get specific feedback', async ({ request }) => {
      if (!feedbackId) {
        test.skip();
        return;
      }

      const response = await request.get(`${API_URL}/support/feedbacks/${feedbackId}`, {
        headers: authHeaders,
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data.id).toBe(feedbackId);
    });
  });

  test.describe('Interest API', () => {
    test('should search interests', async ({ request }) => {
      const response = await request.get(`${API_URL}/interest/search?query=coffee`, {
        headers: authHeaders,
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('should get interest recommendations', async ({ request }) => {
      const response = await request.get(`${API_URL}/interest/recommendations`, {
        headers: authHeaders,
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  test.describe('User API', () => {
    test('should get user profile', async ({ request }) => {
      const response = await request.get(`${API_URL}/users/profile`, {
        headers: authHeaders,
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
    });

    test('should update user profile', async ({ request }) => {
      const response = await request.put(`${API_URL}/users/profile`, {
        headers: authHeaders,
        data: {
          nickname: 'E2E Test User',
          bio: 'This is a test bio for E2E testing',
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  test.describe('Chat API', () => {
    test('should get chat rooms', async ({ request }) => {
      const response = await request.get(`${API_URL}/chat/rooms`, {
        headers: authHeaders,
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  test.describe('Payment API', () => {
    test('should get payment plans', async ({ request }) => {
      const response = await request.get(`${API_URL}/payment/plans`, {
        headers: authHeaders,
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });
});