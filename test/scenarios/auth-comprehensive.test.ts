import { test, expect } from '@playwright/test';
import { API_BASE_URL } from '../config';
import { createTestUser, generatePhoneNumber } from '../helpers/test-data';
import { apiRequest } from '../helpers/api-client';

test.describe('포괄적인 인증 시나리오 테스트', () => {
  const testPhone = generatePhoneNumber();
  const testUser = createTestUser({ phoneNumber: testPhone });
  let authToken: string;
  let userId: string;

  test('전체 인증 플로우 테스트', async ({ request }) => {
    // 1. SMS 인증 요청
    const smsResponse = await apiRequest(request, 'POST', '/auth/verify-phone', {
      phoneNumber: testPhone
    });
    
    expect(smsResponse.status).toBe(200);
    expect(smsResponse.data).toHaveProperty('message');
    expect(smsResponse.data.message).toContain('SMS');

    // 2. SMS 코드 검증
    const verifyResponse = await apiRequest(request, 'POST', '/auth/verify-sms', {
      phoneNumber: testPhone,
      code: '1234' // 테스트 환경 고정 코드
    });

    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.data).toHaveProperty('verified', true);

    // 3. 회원가입
    const registerResponse = await apiRequest(request, 'POST', '/auth/register', {
      phoneNumber: testPhone,
      nickname: testUser.nickname,
      realName: testUser.realName,
      birthYear: testUser.birthYear,
      gender: testUser.gender,
      password: testUser.password
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.data).toHaveProperty('token');
    expect(registerResponse.data).toHaveProperty('user');
    
    authToken = registerResponse.data.token;
    userId = registerResponse.data.user.id;

    // 4. 프로필 조회
    const profileResponse = await apiRequest(request, 'GET', '/users/me', null, {
      'Authorization': `Bearer ${authToken}`
    });

    expect(profileResponse.status).toBe(200);
    expect(profileResponse.data).toHaveProperty('id', userId);
    expect(profileResponse.data).toHaveProperty('nickname', testUser.nickname);

    // 5. 프로필 업데이트
    const updateResponse = await apiRequest(request, 'PUT', '/users/profile', {
      bio: '테스트 자기소개입니다.',
      interests: ['커피', '영화', '독서']
    }, {
      'Authorization': `Bearer ${authToken}`
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.data).toHaveProperty('bio', '테스트 자기소개입니다.');
  });

  test('에러 케이스 처리', async ({ request }) => {
    // 잘못된 전화번호 형식
    const invalidPhoneResponse = await apiRequest(request, 'POST', '/auth/verify-phone', {
      phoneNumber: '123456'
    });
    
    expect(invalidPhoneResponse.status).toBe(400);
    expect(invalidPhoneResponse.error).toContain('전화번호');

    // 인증되지 않은 접근
    const unauthorizedResponse = await apiRequest(request, 'GET', '/users/me');
    
    expect(unauthorizedResponse.status).toBe(401);
    expect(unauthorizedResponse.error).toContain('인증');

    // 잘못된 토큰
    const invalidTokenResponse = await apiRequest(request, 'GET', '/users/me', null, {
      'Authorization': 'Bearer invalid_token'
    });
    
    expect(invalidTokenResponse.status).toBe(401);
    expect(invalidTokenResponse.error).toContain('토큰');
  });

  test('중복 가입 방지', async ({ request }) => {
    // 같은 전화번호로 재가입 시도
    const duplicateResponse = await apiRequest(request, 'POST', '/auth/register', {
      phoneNumber: testPhone,
      nickname: '다른닉네임',
      realName: '다른이름',
      birthYear: 1990,
      gender: 'MALE',
      password: 'password123'
    });

    expect(duplicateResponse.status).toBe(400);
    expect(duplicateResponse.error).toContain('이미 가입');
  });
});