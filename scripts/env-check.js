#!/usr/bin/env node

/**
 * 환경변수 체크 스크립트
 * 필수 환경변수가 설정되어 있는지 확인
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// 필수 환경변수 목록
const requiredEnvVars = {
  server: [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'CLERK_SECRET_KEY',
    'CLERK_PUBLISHABLE_KEY',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
  ],
  mobile: [
    'EXPO_PUBLIC_API_URL',
    'EXPO_PUBLIC_WEBSOCKET_URL',
    'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
  ],
  web: [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  ],
};

// 민감한 환경변수 (값이 노출되면 안 됨)
const sensitiveEnvVars = [
  'CLERK_SECRET_KEY',
  'STRIPE_SECRET_KEY',
  'JWT_SECRET',
  'ENCRYPTION_KEY',
  'AWS_SECRET_ACCESS_KEY',
  'FIREBASE_PRIVATE_KEY',
  'TOSSPAY_SECRET_KEY',
  'NAVER_CLIENT_SECRET',
];

function checkEnvFile(envPath, appType) {
  console.log(chalk.blue(`\n📋 Checking ${appType} environment variables...`));
  
  if (!fs.existsSync(envPath)) {
    console.log(chalk.red(`❌ .env file not found at ${envPath}`));
    console.log(chalk.yellow(`   Please create one from .env.example`));
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  // 환경변수 파싱
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });

  let hasErrors = false;
  const required = requiredEnvVars[appType] || [];

  // 필수 환경변수 체크
  required.forEach(varName => {
    if (!envVars[varName] || envVars[varName] === '') {
      console.log(chalk.red(`❌ Missing required: ${varName}`));
      hasErrors = true;
    } else {
      // 민감한 정보는 값을 숨김
      const isSensitive = sensitiveEnvVars.includes(varName);
      const displayValue = isSensitive ? '***' : envVars[varName];
      console.log(chalk.green(`✅ ${varName}: ${displayValue}`));
    }
  });

  // 추가 권장사항
  if (!hasErrors) {
    console.log(chalk.green(`\n✨ All required ${appType} environment variables are set!`));
    
    // 보안 체크
    sensitiveEnvVars.forEach(varName => {
      if (envVars[varName] && envVars[varName].includes('your_') && envVars[varName].includes('_here')) {
        console.log(chalk.yellow(`⚠️  ${varName} appears to be a placeholder value`));
      }
    });
  }

  return !hasErrors;
}

function main() {
  console.log(chalk.bold.cyan('🔍 Glimpse Environment Variables Checker\n'));

  const rootDir = path.resolve(__dirname, '..');
  let allValid = true;

  // 루트 .env 체크
  const rootEnvPath = path.join(rootDir, '.env');
  if (fs.existsSync(rootEnvPath)) {
    allValid = checkEnvFile(rootEnvPath, 'server') && allValid;
  }

  // 서버 .env 체크
  const serverEnvPath = path.join(rootDir, 'server', '.env');
  if (fs.existsSync(serverEnvPath)) {
    allValid = checkEnvFile(serverEnvPath, 'server') && allValid;
  }

  // 모바일 .env 체크
  const mobileEnvPath = path.join(rootDir, 'mobile', '.env');
  if (fs.existsSync(mobileEnvPath)) {
    allValid = checkEnvFile(mobileEnvPath, 'mobile') && allValid;
  }

  // 웹 .env 체크
  const webEnvPath = path.join(rootDir, 'web', '.env.local');
  if (fs.existsSync(webEnvPath)) {
    allValid = checkEnvFile(webEnvPath, 'web') && allValid;
  }

  console.log('\n' + chalk.bold.cyan('=' .repeat(50)));
  
  if (allValid) {
    console.log(chalk.bold.green('\n✅ Environment check passed!\n'));
    process.exit(0);
  } else {
    console.log(chalk.bold.red('\n❌ Environment check failed!\n'));
    console.log(chalk.yellow('Please ensure all required environment variables are set.'));
    console.log(chalk.yellow('Refer to .env.example for the complete list.\n'));
    process.exit(1);
  }
}

// 실행
main();