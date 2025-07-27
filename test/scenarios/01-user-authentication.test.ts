import { test, expect } from '@playwright/test';
import { API_BASE_URL } from '../config';

test.describe('시나리오 1: 사용자 가입 및 인증', () => {
  const testPhone = '010-1111-1111';
  const verificationCode = '123456'; // 개발 환경에서는 고정 코드 사용
  
  let accessToken: string;

  test('1.1 SMS 인증 요청', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/verify-phone`, {
      data: {
        phoneNumber: testPhone
      }
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('SMS');
  });

  test('1.2 SMS 코드 검증', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/verify-sms`, {
      data: {
        phoneNumber: testPhone,
        code: verificationCode
      }
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('verified', true);
    expect(body).toHaveProperty('token');
  });

  test('1.3 회원가입 완료', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        phoneNumber: testPhone,
        nickname: '테스트유저1',
        age: 28,
        gender: 'MALE',
        bio: '안녕하세요, 테스트 사용자입니다.'
      }
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('user');
    expect(body).toHaveProperty('token');
    
    // 토큰 저장
    accessToken = body.token;
    
    // 사용자 정보 검증
    const user = body.user;
    expect(user.nickname).toBe('테스트유저1');
    expect(user.age).toBe(28);
    expect(user.gender).toBe('MALE');
    expect(user.isVerified).toBe(true);
    expect(user.credits).toBeGreaterThan(0); // 기본 크레딧
  });

  test('1.4 프로필 조회', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const user = await response.json();
    expect(user.phoneNumber).toBe(testPhone);
    expect(user.anonymousId).toBeTruthy();
    expect(user.isPremium).toBe(false);
  });

  test('1.5 프로필 업데이트', async ({ request }) => {
    const response = await request.put(`${API_BASE_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      data: {
        bio: '업데이트된 자기소개입니다.',
        age: 29
      }
    });

    expect(response.ok()).toBeTruthy();
    const user = await response.json();
    expect(user.bio).toBe('업데이트된 자기소개입니다.');
    expect(user.age).toBe(29);
  });

  test('1.6 중복 가입 방지', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        phoneNumber: testPhone,
        nickname: '중복테스트',
        age: 25,
        gender: 'MALE'
      }
    });

    expect(response.status()).toBe(409); // Conflict
    const error = await response.json();
    expect(error).toHaveProperty('error');
  });

  test('1.7 토큰 갱신', async ({ request }) => {
    // 실제 환경에서는 refreshToken을 사용
    const response = await request.post(`${API_BASE_URL}/auth/refresh`, {
      data: {
        refreshToken: 'dummy-refresh-token'
      }
    });

    // 개발 환경에서는 구현에 따라 다를 수 있음
    expect([200, 401]).toContain(response.status());
  });

  test('1.8 로그아웃', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/logout`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    expect([204, 200]).toContain(response.status());
  });
});

test.describe('시나리오 1-2: 인증 실패 케이스', () => {
  test('잘못된 전화번호 형식', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/verify-phone`, {
      data: {
        phoneNumber: '01012341234' // 하이픈 없음
      }
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error).toHaveProperty('errors');
  });

  test('잘못된 인증 코드', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/verify-sms`, {
      data: {
        phoneNumber: '010-1111-1111',
        code: '999999' // 잘못된 코드
      }
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error).toHaveProperty('error');
  });

  test('미인증 API 접근', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/users/me`);
    
    expect(response.status()).toBe(401);
    const error = await response.json();
    expect(error).toHaveProperty('error');
  });

  test('잘못된 토큰으로 접근', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/users/me`, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    expect(response.status()).toBe(401);
  });
});