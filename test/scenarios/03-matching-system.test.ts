import { test, expect } from '@playwright/test';
import { API_BASE_URL, createTestUser, createTestGroup } from '../config';

test.describe('시나리오 3: 익명 좋아요 및 매칭 시스템', () => {
  let userAToken: string; // 남성
  let userBToken: string; // 여성
  let userCToken: string; // 남성
  let userDToken: string; // 여성
  let groupId: string;
  let matchId: string;

  test.beforeAll(async () => {
    // 테스트 사용자 생성
    userAToken = await createTestUser('010-1111-1111', '테스트남1', 28, 'MALE');
    userBToken = await createTestUser('010-2222-2222', '테스트여1', 26, 'FEMALE');
    userCToken = await createTestUser('010-3333-3333', '테스트남2', 30, 'MALE');
    userDToken = await createTestUser('010-4444-4444', '테스트여2', 25, 'FEMALE');

    // 테스트 그룹 생성 및 모든 사용자 가입
    groupId = await createTestGroup(userAToken, '매칭테스트그룹');
    
    // 모든 사용자를 그룹에 가입
    for (const token of [userBToken, userCToken, userDToken]) {
      await fetch(`${API_BASE_URL}/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }
  });

  test('3.1 크레딧 확인', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/users/credits`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.credits).toBeGreaterThan(0);
    expect(result.dailyLikeAvailable).toBe(true);
  });

  test('3.2 그룹 내 추천 사용자 조회', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/users/recommendations?groupId=${groupId}`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const recommendations = await response.json();
    expect(Array.isArray(recommendations)).toBeTruthy();
    
    // 익명성 검증
    recommendations.forEach((user: any) => {
      expect(user).toHaveProperty('anonymousId');
      expect(user).toHaveProperty('nickname');
      expect(user).not.toHaveProperty('phoneNumber');
      expect(user).not.toHaveProperty('realName');
    });
  });

  test('3.3 좋아요 보내기 (A → B)', async ({ request }) => {
    // 먼저 B의 ID를 찾기
    const recsResponse = await request.get(`${API_BASE_URL}/users/recommendations?groupId=${groupId}`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      }
    });
    const recommendations = await recsResponse.json();
    const userB = recommendations.find((u: any) => u.gender === 'FEMALE');
    
    expect(userB).toBeTruthy();

    const response = await request.post(`${API_BASE_URL}/users/like`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      },
      data: {
        toUserId: userB.id,
        groupId: groupId
      }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result).toHaveProperty('like');
    expect(result.like.isAnonymous).toBe(true);
    expect(result.isMatch).toBe(false); // 아직 매치 아님
  });

  test('3.4 받은 좋아요 목록 조회 (B 입장)', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/users/likes/received`, {
      headers: {
        'Authorization': `Bearer ${userBToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const likes = await response.json();
    expect(Array.isArray(likes)).toBeTruthy();
    
    // 익명으로 표시되어야 함
    const receivedLike = likes[0];
    expect(receivedLike).toHaveProperty('fromUser');
    expect(receivedLike.fromUser).toHaveProperty('anonymousId');
    expect(receivedLike.fromUser).not.toHaveProperty('realName');
  });

  test('3.5 좋아요 되돌리기 (B → A로 매칭 성사)', async ({ request }) => {
    // A의 ID 찾기
    const recsResponse = await request.get(`${API_BASE_URL}/users/recommendations?groupId=${groupId}`, {
      headers: {
        'Authorization': `Bearer ${userBToken}`
      }
    });
    const recommendations = await recsResponse.json();
    const userA = recommendations.find((u: any) => u.gender === 'MALE');

    const response = await request.post(`${API_BASE_URL}/users/like`, {
      headers: {
        'Authorization': `Bearer ${userBToken}`
      },
      data: {
        toUserId: userA.id,
        groupId: groupId
      }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.isMatch).toBe(true); // 매칭 성사!
    expect(result).toHaveProperty('match');
    
    matchId = result.match.id;
  });

  test('3.6 매칭 목록 조회', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/matches`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const matches = await response.json();
    expect(Array.isArray(matches)).toBeTruthy();
    
    const match = matches.find((m: any) => m.id === matchId);
    expect(match).toBeTruthy();
    
    // 매칭 후 실명 공개
    expect(match.matchedUser).toHaveProperty('nickname');
    expect(match.matchedUser.isRevealed).toBe(true);
  });

  test('3.7 매칭 상세 정보', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/matches/${matchId}`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const match = await response.json();
    expect(match.id).toBe(matchId);
    expect(match).toHaveProperty('chatChannelId');
  });

  test('3.8 슈퍼 좋아요 보내기 (프리미엄 기능)', async ({ request }) => {
    // C가 D에게 슈퍼 좋아요
    const recsResponse = await request.get(`${API_BASE_URL}/users/recommendations?groupId=${groupId}`, {
      headers: {
        'Authorization': `Bearer ${userCToken}`
      }
    });
    const recommendations = await recsResponse.json();
    const userD = recommendations.find((u: any) => u.gender === 'FEMALE');

    const response = await request.post(`${API_BASE_URL}/users/like`, {
      headers: {
        'Authorization': `Bearer ${userCToken}`
      },
      data: {
        toUserId: userD.id,
        groupId: groupId,
        isSuper: true
      }
    });

    // 프리미엄이 아니면 실패할 수 있음
    if (response.ok()) {
      const result = await response.json();
      expect(result.like.isSuper).toBe(true);
    } else {
      expect(response.status()).toBe(403); // 프리미엄 필요
    }
  });

  test('3.9 좋아요 쿨다운 검증', async ({ request }) => {
    // A가 C에게 좋아요 시도
    const recsResponse = await request.get(`${API_BASE_URL}/users/recommendations?groupId=${groupId}`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      }
    });
    const recommendations = await recsResponse.json();
    const userC = recommendations.find((u: any) => u.id !== userB && u.gender === 'MALE');

    // 첫 번째 좋아요
    await request.post(`${API_BASE_URL}/users/like`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      },
      data: {
        toUserId: userC.id,
        groupId: groupId
      }
    });

    // 즉시 다시 좋아요 시도
    const response = await request.post(`${API_BASE_URL}/users/like`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      },
      data: {
        toUserId: userC.id,
        groupId: groupId
      }
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.error).toContain('쿨다운');
  });

  test('3.10 매칭 해제', async ({ request }) => {
    const response = await request.delete(`${API_BASE_URL}/matches/${matchId}`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      }
    });

    expect([200, 204]).toContain(response.status());
    
    // 매칭 목록에서 제거 확인
    const matchesResponse = await request.get(`${API_BASE_URL}/matches`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      }
    });
    const matches = await matchesResponse.json();
    const deletedMatch = matches.find((m: any) => m.id === matchId);
    expect(deletedMatch?.isActive).toBe(false);
  });
});

test.describe('시나리오 3-2: 좋아요 크레딧 시스템', () => {
  let userToken: string;

  test.beforeAll(async () => {
    userToken = await createTestUser('010-9999-9999', '크레딧테스트', 25, 'MALE');
  });

  test('일일 무료 좋아요 사용', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/users/credits`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    const result = await response.json();
    expect(result.dailyLikeAvailable).toBeDefined();
    expect(result.credits).toBeGreaterThanOrEqual(0);
  });

  test('크레딧 구매', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/users/credits/purchase`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      },
      data: {
        package: 'SMALL', // 5개 크레딧
        paymentMethod: 'CARD'
      }
    });

    // 결제 시스템 구현에 따라 다를 수 있음
    if (response.ok()) {
      const result = await response.json();
      expect(result.credits).toBeGreaterThan(0);
      expect(result.payment).toBeTruthy();
    } else {
      expect(response.status()).toBe(402); // Payment Required
    }
  });
});