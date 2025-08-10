/**
 * 환경 변수 로더
 * @description 환경에 따라 적절한 설정 파일들을 로드하고 환경 변수를 설정
 */

import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

/**
 * 환경 변수 파일들을 우선순위에 따라 로드
 * @param {string} env - 현재 환경 (development, test, staging, production)
 */
export function loadEnvironmentConfig(env = process.env.NODE_ENV || 'development') {
  const configPaths = [
    // 1. 비밀 설정 (최우선순위)
    join(rootDir, 'config', 'private', 'secrets.env'),
    join(rootDir, 'config', 'private', `.env.${env}`),
    
    // 2. 개발자 개인 설정 (로컬 오버라이드)
    join(rootDir, 'config', 'private', '.env.local'),
    
    // 3. 기본 환경 설정 (Git으로 관리되는 공개 설정)
    join(rootDir, '.env.defaults'),
  ];

  console.log(`🔧 Loading environment config for: ${env}`);
  
  // 파일들을 순서대로 로드 (나중에 로드된 것이 우선순위 높음)
  configPaths.forEach(path => {
    if (existsSync(path)) {
      const result = config({ path, override: false });
      if (result.error) {
        console.warn(`⚠️  Warning: Could not load ${path}:`, result.error.message);
      } else {
        console.log(`✅ Loaded: ${path}`);
      }
    } else {
      console.log(`⏭️  Skipped (not found): ${path}`);
    }
  });

  // 환경별 특수 설정
  setupEnvironmentSpecificConfig(env);
}

/**
 * 환경별 특수 설정 적용
 * @param {string} env - 현재 환경
 */
function setupEnvironmentSpecificConfig(env) {
  // NODE_ENV 설정
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = env;
  }

  // 개발 환경 특수 설정
  if (env === 'development') {
    // 개발용 기본값 설정
    process.env.USE_DEV_AUTH = process.env.USE_DEV_AUTH || 'true';
    process.env.DEV_ACCOUNT_TYPE = process.env.DEV_ACCOUNT_TYPE || 'premium';
    
    // 개발용 JWT 토큰이 없으면 기본값 생성
    if (!process.env.DEV_AUTH_TOKEN) {
      process.env.DEV_AUTH_TOKEN = generateDevToken();
    }
  }

  // 테스트 환경 특수 설정
  if (env === 'test') {
    process.env.USE_DEV_AUTH = 'true';
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 
      process.env.DATABASE_URL?.replace(/\/\w+$/, '/glimpse_test');
  }

  // 프로덕션 환경 보안 체크
  if (env === 'production') {
    validateProductionConfig();
  }
}

/**
 * 개발용 JWT 토큰 생성
 */
function generateDevToken() {
  // 실제로는 jwt 라이브러리를 사용하겠지만, 여기서는 기본값 반환
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEiLCJ1c2VySWQiOiJ1c2VyXzEiLCJlbWFpbCI6InVzZXIxQGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJwaG9uZU51bWJlciI6Iis4MjEwMTIzNDU2NzgiLCJpc1ZlcmlmaWVkIjp0cnVlLCJuaWNrbmFtZSI6Iuy7pO2UvOufrOuyhCIsIm5hbWUiOiLsu6TtlLzrn6zrsoQiLCJpYXQiOjE3NTQ1NzY3NDEsImV4cCI6MTc1NzE2ODc0MX0.mPfAyMdphixN6xTNWOSRltx7vLH6cESLJ_K-_AodMxw';
}

/**
 * 프로덕션 환경 필수 변수 검증
 */
function validateProductionConfig() {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'CLERK_SECRET_KEY',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'S3_BUCKET_NAME',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables for production:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

/**
 * 환경 변수 정보 출력 (비밀 정보 제외)
 */
export function printEnvironmentInfo() {
  const safeVars = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    USE_DEV_AUTH: process.env.USE_DEV_AUTH,
    DEV_ACCOUNT_TYPE: process.env.DEV_ACCOUNT_TYPE,
  };

  console.log('🌍 Environment Configuration:');
  Object.entries(safeVars).forEach(([key, value]) => {
    if (value) {
      console.log(`   ${key}: ${value}`);
    }
  });
}

// 자동 로드 (모듈 import 시)
loadEnvironmentConfig();