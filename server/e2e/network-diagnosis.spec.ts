import { test, expect } from '@playwright/test';

const PRODUCTION_BASE_URL = 'https://glimpse-server-psi.vercel.app';

test.describe('Production Network Diagnosis', () => {
  test('comprehensive production server analysis', async ({ page, request }) => {
    console.log('🔍 Starting comprehensive production analysis...');
    
    // Enable network monitoring
    const networkRequests = [];
    const networkResponses = [];
    
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        timestamp: new Date().toISOString()
      });
    });

    page.on('response', response => {
      networkResponses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        timestamp: new Date().toISOString()
      });
    });

    // Test 1: Direct API requests
    console.log('📡 Testing direct API endpoints...');
    
    const endpoints = [
      '/',
      '/health', 
      '/api/health',
      '/api/v1/health',
      '/simple-test',
      '/api/v1/groups',
      '/api/v1/contents'
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Testing endpoint: ${endpoint}`);
        const response = await request.get(`${PRODUCTION_BASE_URL}${endpoint}`, {
          timeout: 10000
        });
        
        console.log(`${endpoint} - Status: ${response.status()}`);
        
        const contentType = response.headers()['content-type'];
        console.log(`${endpoint} - Content-Type: ${contentType}`);
        
        if (response.status() >= 400) {
          const text = await response.text();
          console.log(`${endpoint} - Error Body:`, text.substring(0, 200));
        } else {
          try {
            const json = await response.json();
            console.log(`${endpoint} - Success:`, JSON.stringify(json).substring(0, 100));
          } catch {
            const text = await response.text();
            console.log(`${endpoint} - Text Response:`, text.substring(0, 100));
          }
        }
      } catch (error) {
        console.log(`${endpoint} - Network Error:`, error.message);
      }
    }

    // Test 2: Page navigation analysis
    console.log('🌐 Testing page navigation...');
    
    try {
      await page.goto(`${PRODUCTION_BASE_URL}/`, { 
        waitUntil: 'networkidle', 
        timeout: 30000 
      });
      
      console.log('Page title:', await page.title());
      console.log('Page URL:', page.url());
      
      // Check for any visible error messages
      const errorElements = await page.locator('text=/error|failed|500|internal server error/i').count();
      console.log('Error elements found:', errorElements);
      
    } catch (error) {
      console.log('Page navigation error:', error.message);
    }

    // Test 3: Network timing analysis
    console.log('⏱️ Analyzing network timing...');
    
    try {
      const response = await request.get(`${PRODUCTION_BASE_URL}/health`);
      const timing = response.timing();
      console.log('Network timing:', {
        dns: timing.domainLookup,
        connect: timing.connect,
        request: timing.request,
        response: timing.response
      });
    } catch (error) {
      console.log('Timing analysis error:', error.message);
    }

    // Test 4: Headers analysis
    console.log('📋 Analyzing response headers...');
    
    try {
      const response = await request.get(`${PRODUCTION_BASE_URL}/health`);
      const headers = response.headers();
      
      console.log('Important headers:');
      console.log('  server:', headers['server']);
      console.log('  x-vercel-cache:', headers['x-vercel-cache']);
      console.log('  x-vercel-error:', headers['x-vercel-error']);
      console.log('  x-vercel-id:', headers['x-vercel-id']);
      console.log('  content-type:', headers['content-type']);
      console.log('  cache-control:', headers['cache-control']);
      
    } catch (error) {
      console.log('Headers analysis error:', error.message);
    }

    // Test 5: Try different HTTP methods
    console.log('🔄 Testing different HTTP methods...');
    
    const methods = ['GET', 'POST', 'OPTIONS'];
    
    for (const method of methods) {
      try {
        console.log(`Testing ${method} method...`);
        const response = await request.fetch(`${PRODUCTION_BASE_URL}/health`, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        console.log(`${method} /health - Status: ${response.status()}`);
        
      } catch (error) {
        console.log(`${method} error:`, error.message);
      }
    }

    // Test 6: Check for CORS issues
    console.log('🌍 Testing CORS configuration...');
    
    try {
      const response = await request.fetch(`${PRODUCTION_BASE_URL}/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://glimpse-mobile.vercel.app',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      const corsHeaders = {
        'access-control-allow-origin': response.headers()['access-control-allow-origin'],
        'access-control-allow-methods': response.headers()['access-control-allow-methods'],
        'access-control-allow-headers': response.headers()['access-control-allow-headers']
      };
      
      console.log('CORS headers:', corsHeaders);
      
    } catch (error) {
      console.log('CORS test error:', error.message);
    }

    // Test 7: Test mobile app connectivity
    console.log('📱 Testing mobile app connectivity...');
    
    try {
      await page.goto('https://glimpse-mobile.vercel.app', {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      // Wait for any network requests to complete
      await page.waitForTimeout(5000);
      
      console.log('Mobile app loaded, checking console errors...');
      
      const logs = [];
      page.on('console', msg => {
        logs.push({
          type: msg.type(),
          text: msg.text(),
          timestamp: new Date().toISOString()
        });
      });
      
      await page.waitForTimeout(5000);
      
      const errorLogs = logs.filter(log => log.type === 'error');
      console.log('Console errors:', errorLogs.length);
      
      errorLogs.forEach(log => {
        console.log(`  [${log.type}] ${log.text}`);
      });
      
    } catch (error) {
      console.log('Mobile app test error:', error.message);
    }

    // Print network summary
    console.log('📊 Network Summary:');
    console.log(`Total requests: ${networkRequests.length}`);
    console.log(`Total responses: ${networkResponses.length}`);
    
    const failedRequests = networkResponses.filter(r => r.status >= 400);
    console.log(`Failed requests: ${failedRequests.length}`);
    
    failedRequests.forEach(req => {
      console.log(`  ❌ ${req.url} - ${req.status} ${req.statusText}`);
    });
  });
});