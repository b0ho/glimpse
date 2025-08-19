import { test, expect } from '@playwright/test';

const PRODUCTION_BASE_URL = 'https://glimpse-server-psi.vercel.app';
const PRODUCTION_MOBILE_URL = 'https://glimpse-mobile.vercel.app';

test.describe('Production API Tests', () => {
  test('should test production server health', async ({ request }) => {
    console.log('Testing production server health...');
    
    try {
      const response = await request.get(`${PRODUCTION_BASE_URL}/health`);
      console.log('Health check status:', response.status());
      
      if (response.ok()) {
        const data = await response.json();
        console.log('Health check response:', data);
      } else {
        console.log('Health check failed with status:', response.status());
        const text = await response.text();
        console.log('Error response:', text);
      }
    } catch (error) {
      console.error('Health check error:', error);
    }
  });

  test('should test production groups API', async ({ request }) => {
    console.log('Testing production groups API...');
    
    try {
      const response = await request.get(`${PRODUCTION_BASE_URL}/api/v1/groups`);
      console.log('Groups API status:', response.status());
      
      if (response.ok()) {
        const data = await response.json();
        console.log('Groups API success! Groups count:', data.data?.length || 0);
        console.log('First few groups:', data.data?.slice(0, 3));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log('Groups API failed:', {
          status: response.status(),
          error: errorData
        });
      }
    } catch (error) {
      console.error('Groups API error:', error);
    }
  });

  test('should test production content creation', async ({ request }) => {
    console.log('Testing production content creation...');
    
    try {
      const response = await request.post(`${PRODUCTION_BASE_URL}/api/v1/contents`, {
        data: {
          text: '프로덕션 환경 DB 연동 테스트 - ' + new Date().toISOString(),
          groupId: 'cmeh8afz4004o1mb7s8w8kch7'
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Content creation status:', response.status());
      
      if (response.ok()) {
        const data = await response.json();
        console.log('✅ Content creation SUCCESS in production!');
        console.log('Created content:', data.data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ Content creation FAILED in production:', {
          status: response.status(),
          error: errorData
        });
      }
    } catch (error) {
      console.error('Content creation error:', error);
    }
  });

  test('should access production mobile app', async ({ page }) => {
    console.log('Testing production mobile app access...');
    
    try {
      await page.goto(PRODUCTION_MOBILE_URL, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      console.log('Mobile app loaded, checking for content...');
      
      // Wait for any content to load
      await page.waitForTimeout(3000);
      
      // Check if there are any error messages
      const errorMessages = await page.locator('text=/error|failed|cannot connect/i').count();
      console.log('Error messages found:', errorMessages);
      
      // Check network requests
      const title = await page.title();
      console.log('Page title:', title);
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'production-mobile-test.png', fullPage: true });
      console.log('Screenshot saved: production-mobile-test.png');
      
    } catch (error) {
      console.error('Mobile app access error:', error);
    }
  });

  test('should check database connection via API', async ({ request }) => {
    console.log('Testing database connection via API...');
    
    // Test multiple endpoints to see which ones work
    const endpoints = [
      '/health',
      '/api/v1/groups',
      '/api/v1/auth/me'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing endpoint: ${endpoint}`);
        const response = await request.get(`${PRODUCTION_BASE_URL}${endpoint}`);
        
        console.log(`${endpoint} - Status: ${response.status()}`);
        
        if (response.ok()) {
          const data = await response.json();
          console.log(`${endpoint} - Success:`, data);
        } else {
          const errorText = await response.text();
          console.log(`${endpoint} - Error:`, errorText);
        }
      } catch (error) {
        console.error(`${endpoint} - Network error:`, error);
      }
    }
  });
});