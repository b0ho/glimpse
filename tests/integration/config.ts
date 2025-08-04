// Test configuration and helper functions

export const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api/v1';
export const WS_URL = process.env.WS_URL || 'http://localhost:3001';

// Test user data
export const TEST_USERS = {
  male1: { phone: '010-1111-1111', nickname: '테스트남1', age: 28, gender: 'MALE' as const },
  female1: { phone: '010-2222-2222', nickname: '테스트여1', age: 26, gender: 'FEMALE' as const },
  male2: { phone: '010-3333-3333', nickname: '테스트남2', age: 30, gender: 'MALE' as const },
  female2: { phone: '010-4444-4444', nickname: '테스트여2', age: 25, gender: 'FEMALE' as const },
};

// Helper function to create test user and get token
export async function createTestUser(
  phoneNumber: string, 
  nickname: string, 
  age: number, 
  gender: 'MALE' | 'FEMALE',
  isPremium = false
): Promise<string> {
  // SMS 인증 요청
  await fetch(`${API_BASE_URL}/auth/verify-phone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber })
  });

  // SMS 코드 확인 (개발환경에서는 123456 고정)
  await fetch(`${API_BASE_URL}/auth/verify-sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, code: '123456' })
  });

  // 회원가입
  const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumber,
      nickname,
      age,
      gender,
      bio: `${nickname}의 자기소개`
    })
  });

  const { token } = await registerResponse.json();

  // 프리미엄 업그레이드 (테스트용)
  if (isPremium) {
    await fetch(`${API_BASE_URL}/test/make-premium`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  return token;
}

// Helper function to get auth token for existing user
export async function getAuthToken(phoneNumber: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/test-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber })
  });

  const { token } = await response.json();
  return token;
}

// Helper function to create a test group
export async function createTestGroup(creatorToken: string, groupName: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/groups`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${creatorToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: groupName,
      description: `${groupName} 설명`,
      type: 'CREATED',
      settings: {
        requiresApproval: false,
        allowInvites: true,
        isPrivate: false
      }
    })
  });

  const group = await response.json();
  return group.id;
}

// Helper function to create a match between two users
export async function createMatch(userAToken: string, userBToken: string): Promise<string> {
  // Create a group and join both users
  const groupId = await createTestGroup(userAToken, '매칭테스트그룹');
  
  // User B joins the group
  await fetch(`${API_BASE_URL}/groups/${groupId}/join`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userBToken}`,
      'Content-Type': 'application/json'
    }
  });

  // Get user IDs
  const userAResponse = await fetch(`${API_BASE_URL}/users/me`, {
    headers: { 'Authorization': `Bearer ${userAToken}` }
  });
  const userA = await userAResponse.json();

  const userBResponse = await fetch(`${API_BASE_URL}/users/me`, {
    headers: { 'Authorization': `Bearer ${userBToken}` }
  });
  const userB = await userBResponse.json();

  // A likes B
  await fetch(`${API_BASE_URL}/users/like`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userAToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      toUserId: userB.id,
      groupId: groupId
    })
  });

  // B likes A (creates match)
  const likeResponse = await fetch(`${API_BASE_URL}/users/like`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userBToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      toUserId: userA.id,
      groupId: groupId
    })
  });

  const { match } = await likeResponse.json();
  return match.id;
}

// Test database reset helper
export async function resetTestDatabase(): Promise<void> {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Database reset is only allowed in test environment');
  }

  await fetch(`${API_BASE_URL}/test/reset-db`, {
    method: 'POST',
    headers: {
      'X-Test-Secret': process.env.TEST_SECRET || 'test-secret'
    }
  });
}

// Wait helper
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}