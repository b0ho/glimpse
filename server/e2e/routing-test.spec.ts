import { test, expect } from '@playwright/test';

const PRODUCTION_BASE_URL = 'https://glimpse-server-psi.vercel.app';

test.describe('Vercel 라우팅 테스트', () => {
  test('개별 엔드포인트들이 접근 가능한지 확인', async ({ request }) => {
    console.log('=== 개별 엔드포인트 테스트 ===');
    
    // 1. minimal 엔드포인트 테스트
    try {
      console.log('Testing /minimal...');
      const minimalResponse = await request.get(`${PRODUCTION_BASE_URL}/minimal`);
      console.log('Minimal status:', minimalResponse.status());
      
      if (minimalResponse.ok()) {
        const data = await minimalResponse.json();
        console.log('Minimal response:', data);
      } else {
        const text = await minimalResponse.text();
        console.log('Minimal error:', text);
      }
    } catch (error) {
      console.error('Minimal endpoint error:', error);
    }

    // 2. health 엔드포인트 테스트  
    try {
      console.log('\nTesting /health...');
      const healthResponse = await request.get(`${PRODUCTION_BASE_URL}/health`);
      console.log('Health status:', healthResponse.status());
      
      if (healthResponse.ok()) {
        const data = await healthResponse.json();
        console.log('Health response:', data);
      } else {
        const text = await healthResponse.text();
        console.log('Health error:', text);
      }
    } catch (error) {
      console.error('Health endpoint error:', error);
    }

    // 3. debug 엔드포인트 테스트
    try {
      console.log('\nTesting /debug...');
      const debugResponse = await request.get(`${PRODUCTION_BASE_URL}/debug`);
      console.log('Debug status:', debugResponse.status());
      
      if (debugResponse.ok()) {
        const data = await debugResponse.json();
        console.log('Debug response:', data);
      } else {
        const text = await debugResponse.text();
        console.log('Debug error:', text);
      }
    } catch (error) {
      console.error('Debug endpoint error:', error);
    }

    // 4. 메인 API 엔드포인트 테스트
    try {
      console.log('\nTesting main API...');
      const mainResponse = await request.get(`${PRODUCTION_BASE_URL}/`);
      console.log('Main API status:', mainResponse.status());
      
      if (mainResponse.ok()) {
        const data = await mainResponse.json();
        console.log('Main API response:', data);
      } else {
        const text = await mainResponse.text();
        console.log('Main API error:', text);
      }
    } catch (error) {
      console.error('Main API error:', error);
    }

    // 5. /api/v1/groups 엔드포인트 테스트
    try {
      console.log('\nTesting /api/v1/groups...');
      const groupsResponse = await request.get(`${PRODUCTION_BASE_URL}/api/v1/groups`);
      console.log('Groups status:', groupsResponse.status());
      
      if (groupsResponse.ok()) {
        const data = await groupsResponse.json();
        console.log('Groups response:', data);
      } else {
        const text = await groupsResponse.text();
        console.log('Groups error:', text);
      }
    } catch (error) {
      console.error('Groups endpoint error:', error);
    }
  });

  test('curl 명령어로도 확인', async () => {
    console.log('=== CURL 테스트 ===');
    
    const endpoints = [
      '/minimal',
      '/health', 
      '/debug',
      '/',
      '/api/v1/groups'
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`\nTesting: ${PRODUCTION_BASE_URL}${endpoint}`);
        const response = await fetch(`${PRODUCTION_BASE_URL}${endpoint}`);
        console.log(`Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Response:', JSON.stringify(data, null, 2));
        } else {
          const text = await response.text();
          console.log('Error response:', text);
        }
      } catch (error) {
        console.error(`Error for ${endpoint}:`, error.message);
      }
    }
  });
});