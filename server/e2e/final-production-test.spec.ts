import { test, expect } from '@playwright/test';

const PRODUCTION_BASE_URL = 'https://glimpse-server-psi.vercel.app';

test.describe('프로덕션 API 최종 테스트', () => {
  test('작동하는 엔드포인트들 확인', async ({ request }) => {
    console.log('=== 작동하는 엔드포인트 테스트 ===');
    
    // 1. hello 엔드포인트 (작동 확인됨)
    const helloResponse = await request.get(`${PRODUCTION_BASE_URL}/api/hello`);
    console.log('Hello status:', helloResponse.status());
    expect(helloResponse.status()).toBe(200);
    
    const helloData = await helloResponse.json();
    console.log('Hello response:', helloData);
    expect(helloData.hello).toBe('world');

    // 2. simple 엔드포인트 (작동 확인됨)
    const simpleResponse = await request.get(`${PRODUCTION_BASE_URL}/api/simple`);
    console.log('Simple status:', simpleResponse.status());
    expect(simpleResponse.status()).toBe(200);
    
    const simpleData = await simpleResponse.json();
    console.log('Simple response:', simpleData);
    expect(simpleData.status).toBe('success');
    expect(simpleData.environment.hasDatabase).toBe(true);
    expect(simpleData.environment.hasEncryption).toBe(true);
  });

  test('v1 API 경로 테스트', async ({ request }) => {
    console.log('=== v1 API 경로 테스트 ===');
    
    // v1/health 테스트
    try {
      const healthResponse = await request.get(`${PRODUCTION_BASE_URL}/api/v1/health`);
      console.log('V1 Health status:', healthResponse.status());
      
      if (healthResponse.ok()) {
        const data = await healthResponse.json();
        console.log('V1 Health response:', data);
      } else {
        const text = await healthResponse.text();
        console.log('V1 Health error:', text);
      }
    } catch (error) {
      console.error('V1 Health error:', error);
    }

    // v1/groups 테스트
    try {
      const groupsResponse = await request.get(`${PRODUCTION_BASE_URL}/api/v1/groups`);
      console.log('V1 Groups status:', groupsResponse.status());
      
      if (groupsResponse.ok()) {
        const data = await groupsResponse.json();
        console.log('V1 Groups response:', data);
      } else {
        const text = await groupsResponse.text();
        console.log('V1 Groups error:', text);
      }
    } catch (error) {
      console.error('V1 Groups error:', error);
    }
  });

  test('CORS OPTIONS 요청 테스트', async ({ request }) => {
    console.log('=== CORS OPTIONS 테스트 ===');
    
    // 모바일 앱에서 실제로 보내는 OPTIONS 요청
    try {
      const optionsResponse = await request.fetch(`${PRODUCTION_BASE_URL}/api/v1/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://glimpse-mobile.vercel.app',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'content-type'
        }
      });
      
      console.log('OPTIONS status:', optionsResponse.status());
      console.log('OPTIONS headers:', await optionsResponse.headers());
    } catch (error) {
      console.error('OPTIONS error:', error);
    }
  });
});