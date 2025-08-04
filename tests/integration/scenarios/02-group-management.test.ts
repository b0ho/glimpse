import { test, expect } from '@playwright/test';
import { API_BASE_URL, getAuthToken, createTestUser } from '../config';

test.describe('시나리오 2: 그룹 생성 및 가입', () => {
  let userAToken: string;
  let userBToken: string;
  let createdGroupId: string;
  let officialGroupId: string;

  test.beforeAll(async () => {
    // 테스트 사용자 생성 및 토큰 획득
    userAToken = await createTestUser('010-1111-1111', '그룹생성자', 28, 'MALE');
    userBToken = await createTestUser('010-2222-2222', '그룹참여자', 26, 'FEMALE');
  });

  test('2.1 사용자 생성 그룹 만들기', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/groups`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      },
      data: {
        name: '독서 모임',
        description: '매주 만나는 독서 토론 모임입니다.',
        type: 'CREATED',
        settings: {
          requiresApproval: false,
          allowInvites: true,
          isPrivate: false,
          ageMin: 20,
          ageMax: 40,
          genderRestriction: 'MIXED'
        }
      }
    });

    expect(response.ok()).toBeTruthy();
    const group = await response.json();
    expect(group.name).toBe('독서 모임');
    expect(group.type).toBe('CREATED');
    expect(group.memberCount).toBe(1); // 생성자 자동 가입
    
    createdGroupId = group.id;
  });

  test('2.2 그룹 목록 조회', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/groups`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const groups = await response.json();
    expect(Array.isArray(groups)).toBeTruthy();
    
    const createdGroup = groups.find((g: any) => g.id === createdGroupId);
    expect(createdGroup).toBeTruthy();
  });

  test('2.3 그룹 상세 정보 조회', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/groups/${createdGroupId}`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const group = await response.json();
    expect(group.id).toBe(createdGroupId);
    expect(group.members).toBeTruthy();
    expect(group.isMatchingActive).toBe(false); // 최소 인원 미달
  });

  test('2.4 그룹 가입', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/groups/${createdGroupId}/join`, {
      headers: {
        'Authorization': `Bearer ${userBToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result).toHaveProperty('membership');
    expect(result.membership.status).toBe('ACTIVE');
  });

  test('2.5 그룹 멤버 목록 조회', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/groups/${createdGroupId}/members`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const members = await response.json();
    expect(members.length).toBe(2);
    
    // 익명성 검증 - 실명이 아닌 anonymousId만 표시
    members.forEach((member: any) => {
      expect(member).toHaveProperty('anonymousId');
      expect(member).not.toHaveProperty('phoneNumber');
      expect(member).not.toHaveProperty('realName');
    });
  });

  test('2.6 회사 그룹 검색', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/groups?type=OFFICIAL`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const groups = await response.json();
    
    const officialGroups = groups.filter((g: any) => g.type === 'OFFICIAL');
    if (officialGroups.length > 0) {
      officialGroupId = officialGroups[0].id;
      expect(officialGroups[0]).toHaveProperty('companyId');
    }
  });

  test('2.7 위치 기반 그룹 생성', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/groups`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      },
      data: {
        name: '강남역 모임',
        description: '강남역 근처 즉석 만남',
        type: 'LOCATION',
        location: {
          name: '강남역',
          address: '서울특별시 강남구 강남대로 396',
          latitude: 37.498095,
          longitude: 127.027610,
          radius: 500
        },
        settings: {
          requiresApproval: false,
          allowInvites: false,
          isPrivate: false
        }
      }
    });

    expect(response.ok()).toBeTruthy();
    const group = await response.json();
    expect(group.type).toBe('LOCATION');
    expect(group.location).toBeTruthy();
    expect(group.location.radius).toBe(500);
  });

  test('2.8 인스턴스 그룹 생성 (일회성 이벤트)', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/groups`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      },
      data: {
        name: '오늘 저녁 번개',
        description: '오늘 7시 저녁 같이 드실 분',
        type: 'INSTANCE',
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6시간 후
        settings: {
          requiresApproval: false,
          allowInvites: true,
          isPrivate: false,
          maxMembers: 6
        }
      }
    });

    expect(response.ok()).toBeTruthy();
    const group = await response.json();
    expect(group.type).toBe('INSTANCE');
    expect(group.expiresAt).toBeTruthy();
  });

  test('2.9 그룹 탈퇴', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/groups/${createdGroupId}/leave`, {
      headers: {
        'Authorization': `Bearer ${userBToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    
    // 멤버 수 확인
    const groupResponse = await request.get(`${API_BASE_URL}/groups/${createdGroupId}`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      }
    });
    const group = await groupResponse.json();
    expect(group.memberCount).toBe(1);
  });

  test('2.10 그룹 설정 수정 (관리자만)', async ({ request }) => {
    const response = await request.put(`${API_BASE_URL}/groups/${createdGroupId}`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      },
      data: {
        description: '업데이트된 독서 모임 설명',
        settings: {
          requiresApproval: true,
          ageMin: 25,
          ageMax: 35
        }
      }
    });

    expect(response.ok()).toBeTruthy();
    const group = await response.json();
    expect(group.description).toContain('업데이트된');
    expect(group.settings.requiresApproval).toBe(true);
  });
});

test.describe('시나리오 2-2: 그룹 가입 제한 및 검증', () => {
  let userToken: string;
  let restrictedGroupId: string;

  test.beforeAll(async () => {
    userToken = await createTestUser('010-5555-5555', '제한테스트', 35, 'MALE');
  });

  test('연령 제한 그룹 가입 실패', async ({ request }) => {
    // 20-30세 제한 그룹 생성
    const createResponse = await request.post(`${API_BASE_URL}/groups`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      },
      data: {
        name: '20대 모임',
        type: 'CREATED',
        settings: {
          ageMin: 20,
          ageMax: 30
        }
      }
    });

    restrictedGroupId = (await createResponse.json()).id;

    // 35세 사용자가 가입 시도
    const joinResponse = await request.post(`${API_BASE_URL}/groups/${restrictedGroupId}/join`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    expect(joinResponse.status()).toBe(400);
    const error = await joinResponse.json();
    expect(error.error).toContain('연령');
  });

  test('성별 제한 그룹 검증', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/groups`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      },
      data: {
        name: '여성 전용 모임',
        type: 'CREATED',
        settings: {
          genderRestriction: 'FEMALE_ONLY'
        }
      }
    });

    const group = await response.json();
    expect(group.settings.genderRestriction).toBe('FEMALE_ONLY');
  });

  test('최대 인원 제한 검증', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/groups`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      },
      data: {
        name: '소규모 모임',
        type: 'CREATED',
        settings: {
          maxMembers: 4
        }
      }
    });

    const group = await response.json();
    expect(group.settings.maxMembers).toBe(4);
  });
});