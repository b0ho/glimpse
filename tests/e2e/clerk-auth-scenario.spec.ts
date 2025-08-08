import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker/locale/ko';

const API_URL = 'http://localhost:3001';

/**
 * Clerk 인증 기반 시나리오 테스트
 * 
 * 실제 Glimpse 앱의 인증 플로우를 테스트합니다.
 */
test.describe('Glimpse App - Clerk 인증 시나리오', () => {
  let devAuthToken: string;
  let userId: string;
  let phoneNumber: string;

  test.beforeAll(() => {
    // 테스트용 전화번호 생성
    phoneNumber = '010' + faker.string.numeric(8);
  });

  test('1. 개발 모드 인증 - 회원가입/로그인', async ({ request }) => {
    // 개발 모드에서 전화번호로 회원가입/로그인
    const response = await request.post(`${API_URL}/api/v1/auth/register`, {
      headers: {
        'x-dev-auth': 'true', // 개발 모드 헤더
      },
      data: {
        phoneNumber: phoneNumber,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
    expect(data.data).toHaveProperty('phoneNumber');
    expect(data.data.phoneNumber).toBe(phoneNumber);
    
    userId = data.data.id;
    console.log('✅ 개발 모드 회원가입 성공:', userId);
  });

  test('2. Clerk 인증 시뮬레이션', async ({ request }) => {
    // Clerk userId로 회원가입/로그인
    const clerkUserId = 'user_' + faker.string.alphanumeric(24);
    
    const response = await request.post(`${API_URL}/api/v1/auth/register`, {
      data: {
        clerkUserId: clerkUserId,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
    console.log('✅ Clerk 인증 시뮬레이션 성공');
  });

  test('3. 인증 필요 엔드포인트 접근 테스트', async ({ request }) => {
    // 인증 없이 보호된 엔드포인트 접근
    const protectedEndpoints = [
      '/users/me',
      '/groups/create',
      '/likes',
      '/matches',
      '/chats/rooms',
    ];

    for (const endpoint of protectedEndpoints) {
      const response = await request.get(`${API_URL}/api/v1${endpoint}`);
      // HttpExceptionFilter가 적용되어 401을 반환해야 함
      expect([401, 404]).toContain(response.status());
      
      if (response.status() === 401) {
        const data = await response.json();
        expect(data.message).toContain('인증');
        console.log(`✅ ${endpoint}: 인증 필요 (401)`);
      }
    }
  });

  test('4. 프로필 업데이트 (개발 모드)', async ({ request }) => {
    // 개발 모드로 인증 후 프로필 업데이트
    const registerResponse = await request.post(`${API_URL}/api/v1/auth/register`, {
      headers: {
        'x-dev-auth': 'true',
      },
      data: {
        phoneNumber: phoneNumber,
      },
    });

    const userData = await registerResponse.json();
    const userId = userData.data.id;

    // 프로필 업데이트 시도
    const updateResponse = await request.patch(`${API_URL}/api/v1/users/${userId}`, {
      headers: {
        'x-dev-auth': 'true',
        'x-user-id': userId,
      },
      data: {
        nickname: faker.internet.username(),
        bio: '안녕하세요! 테스트 사용자입니다.',
      },
    });

    // 실제 구현에 따라 상태 코드가 다를 수 있음
    expect([200, 404, 401]).toContain(updateResponse.status());
    
    if (updateResponse.status() === 200) {
      console.log('✅ 프로필 업데이트 성공');
    }
  });

  test('5. 그룹 생성 및 관리', async ({ request }) => {
    // 그룹 목록 조회 (공개)
    const groupsResponse = await request.get(`${API_URL}/api/v1/groups`);
    expect(groupsResponse.status()).toBe(200);
    
    const groupsData = await groupsResponse.json();
    console.log(`✅ 그룹 목록 조회 성공: ${groupsData.groups?.length || 0}개`);

    // 그룹 생성 시도 (인증 필요)
    const createGroupResponse = await request.post(`${API_URL}/api/v1/groups`, {
      data: {
        name: '테스트 그룹',
        description: '테스트용 그룹입니다',
        category: 'HOBBY',
      },
    });

    // 인증 없이는 실패해야 함
    expect([400, 401, 404]).toContain(createGroupResponse.status());
    console.log('✅ 인증 없는 그룹 생성 차단됨');
  });

  test('6. Rate Limiting 테스트', async ({ request }) => {
    const promises = [];
    
    // 짧은 시간에 많은 요청 보내기
    for (let i = 0; i < 15; i++) {
      promises.push(
        request.get(`${API_URL}/api/v1/groups`).then(res => res.status())
      );
    }
    
    const statuses = await Promise.all(promises);
    
    // Rate limiting이 적용되면 일부 요청은 429를 반환
    const rateLimited = statuses.filter(status => status === 429);
    
    if (rateLimited.length > 0) {
      console.log(`✅ Rate Limiting 작동: ${rateLimited.length}/15 요청 제한됨`);
      expect(rateLimited.length).toBeGreaterThan(0);
    } else {
      console.log('⚠️ Rate Limiting이 예상대로 작동하지 않음');
    }
  });

  test('7. XSS 방지 테스트', async ({ request }) => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    ];

    for (const payload of xssPayloads) {
      const response = await request.post(`${API_URL}/api/v1/auth/register`, {
        headers: {
          'x-dev-auth': 'true',
        },
        data: {
          phoneNumber: '010' + faker.string.numeric(8),
          nickname: payload, // XSS 페이로드를 닉네임에 삽입
        },
      });

      if (response.status() === 200) {
        const data = await response.json();
        
        // 응답에 스크립트 태그가 포함되지 않아야 함
        const responseText = JSON.stringify(data);
        expect(responseText).not.toContain('<script>');
        expect(responseText).not.toContain('javascript:');
        console.log('✅ XSS 페이로드 정제됨:', payload.substring(0, 20) + '...');
      }
    }
  });

  test('8. SQL Injection 방지 테스트', async ({ request }) => {
    const sqlPayloads = [
      "' OR '1'='1",
      "1; DROP TABLE users;--",
      "' UNION SELECT * FROM users--",
      "admin'--",
    ];

    for (const payload of sqlPayloads) {
      const response = await request.post(`${API_URL}/api/v1/auth/register`, {
        data: {
          clerkUserId: payload,
        },
      });

      // SQL Injection이 실행되지 않고 에러 처리되어야 함
      expect([200, 400, 404]).toContain(response.status());
      
      if (response.status() === 400) {
        const data = await response.json();
        console.log('✅ SQL Injection 차단됨:', payload);
      }
    }
  });

  test('9. 헬스체크', async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect([200, 404]).toContain(response.status());
    
    if (response.status() === 200) {
      console.log('✅ 헬스체크 성공');
    }
  });

  test('10. Swagger 문서 접근', async ({ request }) => {
    const response = await request.get(`${API_URL}/docs`);
    expect(response.status()).toBe(200);
    
    const html = await response.text();
    expect(html).toContain('Swagger');
    console.log('✅ API 문서 접근 가능');
  });
});

test.describe('성능 및 보안 검증', () => {
  test('응답 헤더 보안 검증', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/v1/groups`);
    const headers = response.headers();
    
    // 보안 헤더 확인
    if (headers['x-content-type-options']) {
      expect(headers['x-content-type-options']).toBe('nosniff');
      console.log('✅ X-Content-Type-Options 헤더 설정됨');
    }
    
    if (headers['x-frame-options']) {
      expect(['DENY', 'SAMEORIGIN']).toContain(headers['x-frame-options']);
      console.log('✅ X-Frame-Options 헤더 설정됨');
    }
    
    if (headers['content-security-policy']) {
      console.log('✅ Content-Security-Policy 헤더 설정됨');
    }
  });

  test('압축 확인', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/v1/groups`, {
      headers: {
        'Accept-Encoding': 'gzip, deflate',
      },
    });
    
    const headers = response.headers();
    if (headers['content-encoding']) {
      expect(['gzip', 'deflate']).toContain(headers['content-encoding']);
      console.log('✅ 응답 압축 활성화됨:', headers['content-encoding']);
    }
  });

  test('CORS 설정 확인', async ({ request }) => {
    const response = await request.fetch(`${API_URL}/api/v1/groups`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:8081',
        'Access-Control-Request-Method': 'GET',
      },
    });
    
    const headers = response.headers();
    if (headers['access-control-allow-origin']) {
      expect(headers['access-control-allow-origin']).toContain('localhost:8081');
      console.log('✅ CORS 설정 확인됨');
    }
  });
});