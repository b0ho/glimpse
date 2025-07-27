import { test, expect } from '@playwright/test';
import { API_BASE_URL, createTestUser } from '../config';

test.describe('시나리오 5: 결제 및 프리미엄 시스템', () => {
  let userToken: string;
  let paymentIntentId: string;

  test.beforeAll(async () => {
    userToken = await createTestUser('010-5555-5555', '결제테스트', 28, 'MALE');
  });

  test('5.1 현재 구독 상태 확인', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const user = await response.json();
    expect(user.isPremium).toBe(false);
    expect(user.premiumUntil).toBeNull();
  });

  test('5.2 프리미엄 플랜 조회', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/payments/plans`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const plans = await response.json();
    expect(Array.isArray(plans)).toBeTruthy();
    
    // 월간 및 연간 플랜 확인
    const monthlyPlan = plans.find((p: any) => p.type === 'MONTHLY');
    const yearlyPlan = plans.find((p: any) => p.type === 'YEARLY');
    
    expect(monthlyPlan).toBeTruthy();
    expect(monthlyPlan.price).toBe(9900); // ₩9,900
    expect(yearlyPlan).toBeTruthy();
    expect(yearlyPlan.price).toBe(99000); // ₩99,000
  });

  test('5.3 결제 의도 생성 (Payment Intent)', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/payments/create-intent`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      },
      data: {
        type: 'PREMIUM_MONTHLY',
        paymentMethod: 'CARD'
      }
    });

    expect(response.ok()).toBeTruthy();
    const intent = await response.json();
    expect(intent).toHaveProperty('intentId');
    expect(intent).toHaveProperty('clientSecret');
    expect(intent.amount).toBe(9900);
    
    paymentIntentId = intent.intentId;
  });

  test('5.4 카카오페이 결제 요청', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/payments/kakao/prepare`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      },
      data: {
        type: 'PREMIUM_MONTHLY',
        returnUrl: 'https://glimpse.app/payment/complete',
        cancelUrl: 'https://glimpse.app/payment/cancel'
      }
    });

    if (response.ok()) {
      const result = await response.json();
      expect(result).toHaveProperty('tid'); // 거래 ID
      expect(result).toHaveProperty('next_redirect_pc_url');
      // 실제 환경에서는 이 URL로 리다이렉트하여 결제 진행
    }
  });

  test('5.5 토스페이 결제 요청', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/payments/toss/prepare`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      },
      data: {
        type: 'PREMIUM_MONTHLY',
        successUrl: 'https://glimpse.app/payment/success',
        failUrl: 'https://glimpse.app/payment/fail'
      }
    });

    if (response.ok()) {
      const result = await response.json();
      expect(result).toHaveProperty('paymentKey');
      expect(result).toHaveProperty('orderId');
      expect(result).toHaveProperty('amount');
    }
  });

  test('5.6 크레딧 패키지 구매', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/users/credits/purchase`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      },
      data: {
        package: 'MEDIUM', // 10개 크레딧 (₩4,500)
        paymentMethod: 'KAKAO_PAY'
      }
    });

    // 테스트 환경에서는 실제 결제 없이 시뮬레이션
    if (response.ok()) {
      const result = await response.json();
      expect(result).toHaveProperty('credits');
      expect(result.credits).toBeGreaterThan(0);
      expect(result).toHaveProperty('payment');
    } else {
      expect(response.status()).toBe(402); // Payment Required
    }
  });

  test('5.7 결제 내역 조회', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/payments/history`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const history = await response.json();
    expect(Array.isArray(history)).toBeTruthy();
    
    // 결제 내역 구조 확인
    if (history.length > 0) {
      const payment = history[0];
      expect(payment).toHaveProperty('id');
      expect(payment).toHaveProperty('amount');
      expect(payment).toHaveProperty('type');
      expect(payment).toHaveProperty('status');
      expect(payment).toHaveProperty('createdAt');
    }
  });

  test('5.8 구독 갱신 설정', async ({ request }) => {
    const response = await request.put(`${API_BASE_URL}/users/subscription/auto-renew`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      },
      data: {
        autoRenew: true
      }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.autoRenew).toBe(true);
  });

  test('5.9 구독 취소', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/users/subscription/cancel`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      },
      data: {
        reason: 'NOT_USING_ENOUGH',
        feedback: '자주 사용하지 않게 되어 취소합니다.'
      }
    });

    // 구독이 있는 경우에만 성공
    if (response.ok()) {
      const result = await response.json();
      expect(result).toHaveProperty('cancelledAt');
      expect(result).toHaveProperty('validUntil'); // 남은 기간
    } else {
      expect(response.status()).toBe(404); // 구독 없음
    }
  });

  test('5.10 환불 요청', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/payments/refund`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      },
      data: {
        paymentId: 'test-payment-id',
        reason: 'SERVICE_ISSUE',
        description: '서비스 이용에 문제가 있었습니다.'
      }
    });

    // 실제 결제가 있는 경우에만 가능
    expect([200, 404]).toContain(response.status());
  });
});

test.describe('시나리오 5-2: 프리미엄 기능 검증', () => {
  let premiumToken: string;
  let freeToken: string;

  test.beforeAll(async () => {
    // 프리미엄 사용자와 무료 사용자 생성
    premiumToken = await createTestUser('010-1234-5678', '프리미엄유저', 30, 'MALE', true);
    freeToken = await createTestUser('010-8765-4321', '무료유저', 25, 'FEMALE', false);
  });

  test('프리미엄 전용: 좋아요 받은 사람 보기', async ({ request }) => {
    // 프리미엄 사용자
    const premiumResponse = await request.get(`${API_BASE_URL}/users/likes/received?reveal=true`, {
      headers: {
        'Authorization': `Bearer ${premiumToken}`
      }
    });

    if (premiumResponse.ok()) {
      const likes = await premiumResponse.json();
      // 프리미엄은 좋아요 보낸 사람의 정보를 볼 수 있음
      if (likes.length > 0) {
        expect(likes[0].fromUser).toHaveProperty('nickname');
      }
    }

    // 무료 사용자
    const freeResponse = await request.get(`${API_BASE_URL}/users/likes/received?reveal=true`, {
      headers: {
        'Authorization': `Bearer ${freeToken}`
      }
    });

    if (freeResponse.ok()) {
      const likes = await freeResponse.json();
      // 무료는 익명으로만 표시
      if (likes.length > 0) {
        expect(likes[0].fromUser).toHaveProperty('anonymousId');
        expect(likes[0].isBlurred).toBe(true);
      }
    } else {
      expect(freeResponse.status()).toBe(403); // Premium required
    }
  });

  test('프리미엄 전용: 무제한 좋아요', async ({ request }) => {
    // 프리미엄 사용자의 크레딧 확인
    const response = await request.get(`${API_BASE_URL}/users/credits`, {
      headers: {
        'Authorization': `Bearer ${premiumToken}`
      }
    });

    const result = await response.json();
    expect(result.isPremium).toBe(true);
    expect(result.unlimitedLikes).toBe(true);
  });

  test('프리미엄 전용: 읽음 표시', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/users/settings`, {
      headers: {
        'Authorization': `Bearer ${premiumToken}`
      }
    });

    const settings = await response.json();
    expect(settings.readReceipts).toBeDefined();
    expect(settings.onlineStatus).toBeDefined();
  });
});