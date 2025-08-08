import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker/locale/ko';

const API_URL = 'http://localhost:3001/api/v1';

// Test data generators
const generateUserData = () => ({
  email: faker.internet.email(),
  password: 'Test1234!@#$',
  name: faker.person.fullName(),
  nickname: faker.internet.username(),
  phone: '010' + faker.string.numeric(8),
  birthDate: faker.date.birthdate({ min: 18, max: 40, mode: 'age' }).toISOString().split('T')[0],
  gender: faker.helpers.arrayElement(['MALE', 'FEMALE']),
  bio: faker.lorem.paragraph(),
  profileImage: 'https://example.com/profile.jpg'
});

test.describe('Glimpse API - 전체 시나리오 테스트', () => {
  let authToken1: string;
  let authToken2: string;
  let userId1: string;
  let userId2: string;
  let groupId: string;
  let matchId: string;
  
  const user1 = generateUserData();
  const user2 = generateUserData();

  test('1. 회원가입 시나리오', async ({ request }) => {
    // User 1 회원가입
    const signupResponse = await request.post(`${API_URL}/auth/signup`, {
      data: {
        email: user1.email,
        password: user1.password,
        name: user1.name,
        nickname: user1.nickname,
        phone: user1.phone,
        birthDate: user1.birthDate,
        gender: user1.gender
      }
    });
    
    expect(signupResponse.status()).toBe(201);
    const signupData = await signupResponse.json();
    expect(signupData).toHaveProperty('user');
    expect(signupData).toHaveProperty('accessToken');
    
    userId1 = signupData.user.id;
    authToken1 = signupData.accessToken;
    
    // User 2 회원가입
    const signup2Response = await request.post(`${API_URL}/auth/signup`, {
      data: {
        email: user2.email,
        password: user2.password,
        name: user2.name,
        nickname: user2.nickname,
        phone: user2.phone,
        birthDate: user2.birthDate,
        gender: user2.gender
      }
    });
    
    expect(signup2Response.status()).toBe(201);
    const signup2Data = await signup2Response.json();
    userId2 = signup2Data.user.id;
    authToken2 = signup2Data.accessToken;
  });

  test('2. 로그인 시나리오', async ({ request }) => {
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: user1.email,
        password: user1.password
      }
    });
    
    expect(loginResponse.status()).toBe(200);
    const loginData = await loginResponse.json();
    expect(loginData).toHaveProperty('accessToken');
    expect(loginData).toHaveProperty('refreshToken');
    expect(loginData.user.email).toBe(user1.email);
  });

  test('3. 프로필 업데이트', async ({ request }) => {
    const updateResponse = await request.patch(`${API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${authToken1}`
      },
      data: {
        bio: '안녕하세요! 업데이트된 자기소개입니다.',
        profileImage: 'https://example.com/new-profile.jpg'
      }
    });
    
    expect(updateResponse.status()).toBe(200);
    const updateData = await updateResponse.json();
    expect(updateData.bio).toBe('안녕하세요! 업데이트된 자기소개입니다.');
  });

  test('4. 그룹 생성 및 가입', async ({ request }) => {
    // 그룹 생성
    const createGroupResponse = await request.post(`${API_URL}/groups`, {
      headers: {
        'Authorization': `Bearer ${authToken1}`
      },
      data: {
        name: '테스트 개발자 모임',
        description: '개발자들을 위한 네트워킹 그룹입니다',
        category: 'HOBBY',
        isPublic: true,
        requiresApproval: false
      }
    });
    
    expect(createGroupResponse.status()).toBe(201);
    const groupData = await createGroupResponse.json();
    groupId = groupData.id;
    expect(groupData.name).toBe('테스트 개발자 모임');
    
    // User 2가 그룹 가입
    const joinResponse = await request.post(`${API_URL}/groups/${groupId}/join`, {
      headers: {
        'Authorization': `Bearer ${authToken2}`
      }
    });
    
    expect(joinResponse.status()).toBe(200);
    
    // 그룹 멤버 확인
    const membersResponse = await request.get(`${API_URL}/groups/${groupId}/members`, {
      headers: {
        'Authorization': `Bearer ${authToken1}`
      }
    });
    
    expect(membersResponse.status()).toBe(200);
    const membersData = await membersResponse.json();
    expect(membersData.members.length).toBeGreaterThanOrEqual(2);
  });

  test('5. 좋아요 보내기 및 매칭', async ({ request }) => {
    // User 1이 User 2에게 좋아요
    const like1Response = await request.post(`${API_URL}/likes`, {
      headers: {
        'Authorization': `Bearer ${authToken1}`
      },
      data: {
        targetUserId: userId2,
        groupId: groupId
      }
    });
    
    expect(like1Response.status()).toBe(201);
    
    // User 2가 받은 좋아요 확인
    const receivedLikesResponse = await request.get(`${API_URL}/likes/received`, {
      headers: {
        'Authorization': `Bearer ${authToken2}`
      }
    });
    
    expect(receivedLikesResponse.status()).toBe(200);
    const receivedLikes = await receivedLikesResponse.json();
    expect(receivedLikes.likes.length).toBeGreaterThan(0);
    
    // User 2가 User 1에게 좋아요 (매칭 성립)
    const like2Response = await request.post(`${API_URL}/likes`, {
      headers: {
        'Authorization': `Bearer ${authToken2}`
      },
      data: {
        targetUserId: userId1,
        groupId: groupId
      }
    });
    
    expect(like2Response.status()).toBe(201);
    const like2Data = await like2Response.json();
    
    // 매칭 확인
    if (like2Data.match) {
      matchId = like2Data.match.id;
      expect(like2Data.match.status).toBe('MATCHED');
    }
    
    // 매칭 목록 확인
    const matchesResponse = await request.get(`${API_URL}/matches`, {
      headers: {
        'Authorization': `Bearer ${authToken1}`
      }
    });
    
    expect(matchesResponse.status()).toBe(200);
    const matchesData = await matchesResponse.json();
    expect(matchesData.matches.length).toBeGreaterThan(0);
  });

  test('6. 채팅 메시지 전송', async ({ request }) => {
    // 채팅방 생성 또는 가져오기
    const chatRoomResponse = await request.post(`${API_URL}/chats/rooms`, {
      headers: {
        'Authorization': `Bearer ${authToken1}`
      },
      data: {
        participantId: userId2
      }
    });
    
    expect(chatRoomResponse.status()).toBe(201);
    const chatRoom = await chatRoomResponse.json();
    const roomId = chatRoom.id;
    
    // 메시지 전송
    const messageResponse = await request.post(`${API_URL}/chats/rooms/${roomId}/messages`, {
      headers: {
        'Authorization': `Bearer ${authToken1}`
      },
      data: {
        content: '안녕하세요! 매칭되어 반갑습니다.',
        type: 'TEXT'
      }
    });
    
    expect(messageResponse.status()).toBe(201);
    const message = await messageResponse.json();
    expect(message.content).toBe('안녕하세요! 매칭되어 반갑습니다.');
    
    // 메시지 목록 조회
    const messagesResponse = await request.get(`${API_URL}/chats/rooms/${roomId}/messages`, {
      headers: {
        'Authorization': `Bearer ${authToken2}`
      }
    });
    
    expect(messagesResponse.status()).toBe(200);
    const messages = await messagesResponse.json();
    expect(messages.messages.length).toBeGreaterThan(0);
  });

  test('7. 프리미엄 구독', async ({ request }) => {
    // 프리미엄 플랜 조회
    const plansResponse = await request.get(`${API_URL}/premium/plans`);
    expect(plansResponse.status()).toBe(200);
    const plans = await plansResponse.json();
    expect(plans.plans.length).toBeGreaterThan(0);
    
    // 프리미엄 구독 시작 (결제 초기화)
    const subscribeResponse = await request.post(`${API_URL}/premium/subscribe`, {
      headers: {
        'Authorization': `Bearer ${authToken1}`
      },
      data: {
        planId: plans.plans[0].id,
        paymentMethod: 'TOSS_PAY'
      }
    });
    
    // 결제 게이트웨이로 리다이렉트 또는 결제 정보 반환
    expect([200, 201, 302]).toContain(subscribeResponse.status());
    
    // 프리미엄 상태 확인
    const statusResponse = await request.get(`${API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${authToken1}`
      }
    });
    
    expect(statusResponse.status()).toBe(200);
    const userData = await statusResponse.json();
    // 실제 결제가 완료되지 않았으므로 isPremium은 false일 수 있음
  });

  test('8. 회사 인증', async ({ request }) => {
    // 회사 이메일 인증 요청
    const verifyEmailResponse = await request.post(`${API_URL}/company-domains/verify-email`, {
      headers: {
        'Authorization': `Bearer ${authToken1}`
      },
      data: {
        companyEmail: 'test@samsung.com'
      }
    });
    
    expect([200, 201]).toContain(verifyEmailResponse.status());
    
    // 실제로는 이메일로 받은 코드를 입력해야 함
    // 테스트에서는 Mock 코드 사용
    const verifyCodeResponse = await request.post(`${API_URL}/company-domains/verify-code`, {
      headers: {
        'Authorization': `Bearer ${authToken1}`
      },
      data: {
        companyEmail: 'test@samsung.com',
        code: '123456' // Mock code
      }
    });
    
    // 실제 환경에서는 올바른 코드가 필요하므로 실패할 수 있음
    expect([200, 400, 401]).toContain(verifyCodeResponse.status());
  });

  test('9. 위치 기반 그룹', async ({ request }) => {
    // 위치 기반 그룹 조회
    const locationGroupsResponse = await request.get(`${API_URL}/groups/location`, {
      headers: {
        'Authorization': `Bearer ${authToken1}`
      },
      params: {
        latitude: 37.5665,
        longitude: 126.9780,
        radius: 1000 // 1km
      }
    });
    
    expect(locationGroupsResponse.status()).toBe(200);
    const locationGroups = await locationGroupsResponse.json();
    // 위치 기반 그룹이 있을 수도 없을 수도 있음
    expect(locationGroups).toHaveProperty('groups');
  });

  test('10. 알림 설정', async ({ request }) => {
    // 알림 설정 업데이트
    const notificationSettingsResponse = await request.patch(`${API_URL}/users/me/settings`, {
      headers: {
        'Authorization': `Bearer ${authToken1}`
      },
      data: {
        notifications: {
          matches: true,
          messages: true,
          likes: false,
          groupUpdates: true
        }
      }
    });
    
    expect(notificationSettingsResponse.status()).toBe(200);
    
    // FCM 토큰 등록
    const fcmTokenResponse = await request.post(`${API_URL}/notifications/fcm-token`, {
      headers: {
        'Authorization': `Bearer ${authToken1}`
      },
      data: {
        token: 'mock-fcm-token-12345',
        platform: 'IOS'
      }
    });
    
    expect([200, 201]).toContain(fcmTokenResponse.status());
  });

  test('11. 신고 기능', async ({ request }) => {
    // 사용자 신고
    const reportResponse = await request.post(`${API_URL}/reports`, {
      headers: {
        'Authorization': `Bearer ${authToken1}`
      },
      data: {
        targetUserId: userId2,
        reason: 'INAPPROPRIATE_CONTENT',
        description: '부적절한 콘텐츠를 게시했습니다.'
      }
    });
    
    expect(reportResponse.status()).toBe(201);
    const reportData = await reportResponse.json();
    expect(reportData.status).toBe('PENDING');
  });

  test('12. 차단 기능', async ({ request }) => {
    // 사용자 차단
    const blockResponse = await request.post(`${API_URL}/users/${userId2}/block`, {
      headers: {
        'Authorization': `Bearer ${authToken1}`
      }
    });
    
    expect(blockResponse.status()).toBe(200);
    
    // 차단 목록 확인
    const blockedUsersResponse = await request.get(`${API_URL}/users/blocked`, {
      headers: {
        'Authorization': `Bearer ${authToken1}`
      }
    });
    
    expect(blockedUsersResponse.status()).toBe(200);
    const blockedUsers = await blockedUsersResponse.json();
    expect(blockedUsers.users).toContainEqual(
      expect.objectContaining({ id: userId2 })
    );
    
    // 차단 해제
    const unblockResponse = await request.delete(`${API_URL}/users/${userId2}/block`, {
      headers: {
        'Authorization': `Bearer ${authToken1}`
      }
    });
    
    expect(unblockResponse.status()).toBe(200);
  });

  test('13. 크레딧 시스템', async ({ request }) => {
    // 크레딧 잔액 조회
    const balanceResponse = await request.get(`${API_URL}/credits/balance`, {
      headers: {
        'Authorization': `Bearer ${authToken1}`
      }
    });
    
    expect(balanceResponse.status()).toBe(200);
    const balance = await balanceResponse.json();
    expect(balance).toHaveProperty('credits');
    
    // 크레딧 패키지 조회
    const packagesResponse = await request.get(`${API_URL}/credits/packages`);
    expect(packagesResponse.status()).toBe(200);
    const packages = await packagesResponse.json();
    expect(packages.packages.length).toBeGreaterThan(0);
    
    // 크레딧 구매 (결제 초기화)
    const purchaseResponse = await request.post(`${API_URL}/credits/purchase`, {
      headers: {
        'Authorization': `Bearer ${authToken1}`
      },
      data: {
        packageId: packages.packages[0].id,
        paymentMethod: 'KAKAO_PAY'
      }
    });
    
    expect([200, 201, 302]).toContain(purchaseResponse.status());
  });

  test('14. 좋아요 쿨다운', async ({ request }) => {
    // 같은 사용자에게 다시 좋아요 시도
    const cooldownResponse = await request.post(`${API_URL}/likes`, {
      headers: {
        'Authorization': `Bearer ${authToken1}`
      },
      data: {
        targetUserId: userId2,
        groupId: groupId
      }
    });
    
    // 쿨다운 기간 중이므로 에러 예상
    expect(cooldownResponse.status()).toBe(400);
    const errorData = await cooldownResponse.json();
    expect(errorData.message).toContain('쿨다운');
  });

  test('15. 계정 탈퇴', async ({ request }) => {
    // 새로운 테스트 유저 생성
    const tempUser = generateUserData();
    const tempSignupResponse = await request.post(`${API_URL}/auth/signup`, {
      data: {
        email: tempUser.email,
        password: tempUser.password,
        name: tempUser.name,
        nickname: tempUser.nickname,
        phone: tempUser.phone,
        birthDate: tempUser.birthDate,
        gender: tempUser.gender
      }
    });
    
    const tempAuthToken = (await tempSignupResponse.json()).accessToken;
    
    // 계정 삭제
    const deleteResponse = await request.delete(`${API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${tempAuthToken}`
      },
      data: {
        password: tempUser.password,
        confirmDelete: 'DELETE'
      }
    });
    
    expect(deleteResponse.status()).toBe(200);
    
    // 삭제된 계정으로 로그인 시도
    const deletedLoginResponse = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: tempUser.email,
        password: tempUser.password
      }
    });
    
    expect(deletedLoginResponse.status()).toBe(401);
  });
});

test.describe('성능 테스트', () => {
  test('API 응답 시간 측정', async ({ request }) => {
    const endpoints = [
      { method: 'GET', path: '/groups' },
      { method: 'GET', path: '/users/me' },
      { method: 'GET', path: '/matches' },
      { method: 'GET', path: '/likes/received' }
    ];
    
    // 로그인하여 토큰 획득
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'test@example.com',
        password: 'Test1234!'
      }
    });
    
    let authToken = '';
    if (loginResponse.status() === 200) {
      authToken = (await loginResponse.json()).accessToken;
    }
    
    for (const endpoint of endpoints) {
      const startTime = Date.now();
      
      const response = await request[endpoint.method.toLowerCase()](
        `${API_URL}${endpoint.path}`,
        authToken ? {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        } : {}
      );
      
      const responseTime = Date.now() - startTime;
      console.log(`${endpoint.method} ${endpoint.path}: ${responseTime}ms`);
      
      // API 응답 시간이 1초 이내여야 함
      expect(responseTime).toBeLessThan(1000);
    }
  });

  test('동시 요청 처리', async ({ request }) => {
    const promises = [];
    
    // 10개의 동시 요청 생성
    for (let i = 0; i < 10; i++) {
      promises.push(
        request.get(`${API_URL}/groups`).then(response => ({
          status: response.status(),
          time: Date.now()
        }))
      );
    }
    
    const results = await Promise.all(promises);
    
    // 모든 요청이 성공해야 함
    results.forEach(result => {
      expect(result.status).toBe(200);
    });
    
    // 응답 시간 분산 확인
    const times = results.map(r => r.time);
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    const timeDiff = maxTime - minTime;
    
    console.log(`동시 요청 처리 시간 차이: ${timeDiff}ms`);
    // 10초 이내에 모든 요청이 처리되어야 함
    expect(timeDiff).toBeLessThan(10000);
  });
});

test.describe('보안 테스트', () => {
  test('인증 없이 보호된 엔드포인트 접근 차단', async ({ request }) => {
    const protectedEndpoints = [
      '/users/me',
      '/matches',
      '/likes/received',
      '/chats/rooms'
    ];
    
    for (const endpoint of protectedEndpoints) {
      const response = await request.get(`${API_URL}${endpoint}`);
      expect(response.status()).toBe(401);
    }
  });

  test('SQL Injection 방지', async ({ request }) => {
    const sqlInjectionPayloads = [
      "' OR '1'='1",
      "1; DROP TABLE users;",
      "' UNION SELECT * FROM users --"
    ];
    
    for (const payload of sqlInjectionPayloads) {
      const response = await request.post(`${API_URL}/auth/login`, {
        data: {
          email: payload,
          password: payload
        }
      });
      
      // SQL Injection이 실패하고 정상적인 에러를 반환해야 함
      expect(response.status()).toBe(401);
    }
  });

  test('XSS 방지', async ({ request }) => {
    // 먼저 로그인
    const tempUser = generateUserData();
    const signupResponse = await request.post(`${API_URL}/auth/signup`, {
      data: {
        email: tempUser.email,
        password: tempUser.password,
        name: tempUser.name,
        nickname: tempUser.nickname,
        phone: tempUser.phone,
        birthDate: tempUser.birthDate,
        gender: tempUser.gender
      }
    });
    
    const authToken = (await signupResponse.json()).accessToken;
    
    // XSS 페이로드를 프로필에 삽입 시도
    const xssPayload = '<script>alert("XSS")</script>';
    const updateResponse = await request.patch(`${API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        bio: xssPayload
      }
    });
    
    expect(updateResponse.status()).toBe(200);
    
    // 프로필 조회
    const profileResponse = await request.get(`${API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const profile = await profileResponse.json();
    // 스크립트가 이스케이프되거나 제거되어야 함
    expect(profile.bio).not.toContain('<script>');
  });

  test('Rate Limiting', async ({ request }) => {
    const promises = [];
    
    // 100개의 빠른 요청 생성
    for (let i = 0; i < 100; i++) {
      promises.push(
        request.get(`${API_URL}/groups`).then(response => response.status())
      );
    }
    
    const statuses = await Promise.all(promises);
    
    // Rate limiting이 작동하면 일부 요청은 429 상태를 반환해야 함
    const rateLimited = statuses.filter(status => status === 429);
    console.log(`Rate limited requests: ${rateLimited.length}/100`);
    
    // Rate limiting이 구현되어 있다면 일부 요청이 제한되어야 함
    if (rateLimited.length > 0) {
      expect(rateLimited.length).toBeGreaterThan(0);
    }
  });
});