#!/usr/bin/env node

/**
 * Clerk Integration Test Script
 * Clerk 연동 상태를 확인하는 테스트 스크립트
 */

const axios = require('axios');
const { clerkClient } = require('@clerk/clerk-sdk-node');

// 환경변수 설정
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:3001';
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// 테스트 결과 출력 함수
function logResult(testName, success, message = '') {
  const status = success ? `${colors.green}✓` : `${colors.red}✗`;
  console.log(`${status} ${testName}${colors.reset}`);
  if (message) {
    console.log(`  ${colors.yellow}→ ${message}${colors.reset}`);
  }
}

// 헤더 출력 함수
function printHeader(title) {
  console.log(`\n${colors.blue}=== ${title} ===${colors.reset}\n`);
}

// Clerk SDK 연결 테스트
async function testClerkSDK() {
  printHeader('Clerk SDK 연결 테스트');
  
  try {
    // Clerk 설정 확인
    if (!CLERK_SECRET_KEY || CLERK_SECRET_KEY === 'sk_test_dummy_key') {
      logResult('Clerk Secret Key 설정', false, '유효한 Clerk Secret Key가 필요합니다');
      return false;
    }
    
    logResult('Clerk Secret Key 설정', true, 'Secret Key가 설정되어 있습니다');
    
    // Clerk API 연결 테스트
    try {
      const users = await clerkClient.users.getUserList({ limit: 1 });
      logResult('Clerk API 연결', true, `Clerk API 연결 성공 (${users.length}명의 사용자)`);
      return true;
    } catch (error) {
      logResult('Clerk API 연결', false, `API 연결 실패: ${error.message}`);
      return false;
    }
  } catch (error) {
    logResult('Clerk SDK 초기화', false, error.message);
    return false;
  }
}

// 로컬 서버 인증 테스트
async function testLocalAuth() {
  printHeader('로컬 서버 인증 API 테스트');
  
  try {
    // Health check
    const healthResponse = await axios.get(`${API_URL}/health`);
    logResult('서버 Health Check', true, `서버 상태: ${healthResponse.data.status}`);
    
    // Auth 엔드포인트 테스트 (개발 모드)
    try {
      const authResponse = await axios.post(
        `${API_URL}/api/v1/auth/verify-phone`,
        {
          phoneNumber: '+821012345678',
          code: '123456'
        },
        {
          headers: { 'x-dev-auth': 'true' }
        }
      );
      logResult('개발 모드 인증', true, 'SMS 인증 API 호출 가능');
    } catch (error) {
      if (error.response?.status === 400) {
        logResult('개발 모드 인증', true, 'API 엔드포인트 존재 (인증 코드 불일치)');
      } else {
        logResult('개발 모드 인증', false, `Status: ${error.response?.status}`);
      }
    }
    
    return true;
  } catch (error) {
    logResult('서버 연결', false, `서버에 연결할 수 없습니다: ${error.message}`);
    return false;
  }
}

// AuthService 통합 테스트
async function testAuthService() {
  printHeader('AuthService Clerk 통합 테스트');
  
  try {
    // JWT 토큰 검증 테스트
    const testToken = 'Bearer test_token_12345';
    
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/users/me`,
        {
          headers: {
            'Authorization': testToken,
            'x-dev-auth': 'true'
          }
        }
      );
      logResult('JWT 토큰 검증', false, '개발 모드에서 토큰 없이 접근됨');
    } catch (error) {
      if (error.response?.status === 401) {
        logResult('JWT 토큰 검증', true, 'JWT 인증이 활성화되어 있음');
      } else {
        logResult('JWT 토큰 검증', false, `예상치 못한 응답: ${error.response?.status}`);
      }
    }
    
    return true;
  } catch (error) {
    logResult('AuthService 테스트', false, error.message);
    return false;
  }
}

// 환경변수 확인
async function checkEnvironment() {
  printHeader('환경변수 설정 확인');
  
  const envVars = {
    'CLERK_SECRET_KEY': process.env.CLERK_SECRET_KEY,
    'CLERK_PUBLISHABLE_KEY': process.env.CLERK_PUBLISHABLE_KEY,
    'USE_DEV_AUTH': process.env.USE_DEV_AUTH,
    'NODE_ENV': process.env.NODE_ENV,
  };
  
  let allSet = true;
  
  for (const [key, value] of Object.entries(envVars)) {
    if (value && value !== 'undefined') {
      logResult(key, true, value.substring(0, 20) + (value.length > 20 ? '...' : ''));
    } else {
      logResult(key, false, '설정되지 않음');
      allSet = false;
    }
  }
  
  return allSet;
}

// 메인 실행 함수
async function main() {
  console.log(`${colors.blue}
╔══════════════════════════════════════╗
║     Clerk Integration Test Suite     ║
╚══════════════════════════════════════╝${colors.reset}`);

  const results = [];
  
  // 1. 환경변수 확인
  results.push(await checkEnvironment());
  
  // 2. 로컬 서버 테스트
  results.push(await testLocalAuth());
  
  // 3. Clerk SDK 테스트
  results.push(await testClerkSDK());
  
  // 4. AuthService 통합 테스트
  results.push(await testAuthService());
  
  // 최종 결과
  printHeader('테스트 결과 요약');
  
  const successCount = results.filter(r => r).length;
  const totalCount = results.length;
  
  if (successCount === totalCount) {
    console.log(`${colors.green}✅ 모든 테스트 통과 (${successCount}/${totalCount})${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️  일부 테스트 실패 (${successCount}/${totalCount})${colors.reset}`);
    console.log(`\n${colors.yellow}권장사항:${colors.reset}`);
    console.log('1. Clerk Dashboard에서 실제 API 키를 발급받아 .env 파일에 설정하세요');
    console.log('2. 개발 모드(USE_DEV_AUTH=true)에서는 Clerk 없이도 동작합니다');
    console.log('3. Production 환경에서는 반드시 유효한 Clerk 키가 필요합니다');
  }
  
  process.exit(successCount === totalCount ? 0 : 1);
}

// 스크립트 실행
main().catch(error => {
  console.error(`${colors.red}테스트 실행 중 오류 발생:${colors.reset}`, error);
  process.exit(1);
});