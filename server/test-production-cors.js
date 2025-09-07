#!/usr/bin/env node

/**
 * Production CORS Testing Script
 * 
 * Tests the production site https://www.glimpse.contact/ for CORS errors
 * Simulates actual browser requests to identify specific CORS issues
 */

const https = require('https');
const http = require('http');

const PRODUCTION_URL = 'https://www.glimpse.contact';
const TEST_ORIGINS = [
  'https://www.glimpse.contact',
  'https://glimpse.contact', 
  'https://glimpse-mobile.vercel.app',
  'https://glimpse-web.vercel.app',
  'null' // For local file access
];

const TEST_ENDPOINTS = [
  '/api/v1/health',
  '/api/v1/groups',
  '/api/hello',
  '/api/simple'
];

async function testCORS() {
  console.log('🔍 Testing CORS configuration on production site...\n');
  
  for (const origin of TEST_ORIGINS) {
    console.log(`📍 Testing Origin: ${origin}`);
    console.log('='.repeat(50));
    
    for (const endpoint of TEST_ENDPOINTS) {
      await testEndpoint(origin, endpoint);
    }
    console.log('\n');
  }
}

function testEndpoint(origin, endpoint) {
  return new Promise((resolve) => {
    const url = new URL(PRODUCTION_URL + endpoint);
    
    // Test OPTIONS preflight request
    console.log(`  OPTIONS ${endpoint}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    };

    const req = https.request(options, (res) => {
      const headers = res.headers;
      
      console.log(`    Status: ${res.statusCode}`);
      console.log(`    CORS Headers:`);
      console.log(`      Access-Control-Allow-Origin: ${headers['access-control-allow-origin'] || 'MISSING'}`);
      console.log(`      Access-Control-Allow-Methods: ${headers['access-control-allow-methods'] || 'MISSING'}`);
      console.log(`      Access-Control-Allow-Headers: ${headers['access-control-allow-headers'] || 'MISSING'}`);
      console.log(`      Access-Control-Allow-Credentials: ${headers['access-control-allow-credentials'] || 'MISSING'}`);
      
      // Check for CORS errors
      const allowOrigin = headers['access-control-allow-origin'];
      if (!allowOrigin || (allowOrigin !== '*' && allowOrigin !== origin)) {
        console.log(`    ❌ CORS ERROR: Origin '${origin}' not allowed`);
      } else {
        console.log(`    ✅ CORS OK: Origin allowed`);
      }
      
      console.log('');
      resolve();
    });

    req.on('error', (error) => {
      console.log(`    ❌ REQUEST ERROR: ${error.message}`);
      console.log('');
      resolve();
    });

    req.setTimeout(10000, () => {
      console.log(`    ⏰ TIMEOUT: Request timed out`);
      console.log('');
      req.destroy();
      resolve();
    });

    req.end();
  });
}

// Run the test
testCORS().then(() => {
  console.log('🏁 CORS testing completed!');
  console.log('\n📋 Summary of Common CORS Issues:');
  console.log('1. Missing Access-Control-Allow-Origin header');
  console.log('2. Origin not in allowed origins list');
  console.log('3. Missing preflight response for OPTIONS requests');
  console.log('4. Missing Access-Control-Allow-Methods header');
  console.log('5. Missing Access-Control-Allow-Headers for custom headers');
  console.log('\n💡 Solution: Update server CORS configuration to include production domains');
}).catch(console.error);