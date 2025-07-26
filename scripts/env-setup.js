#!/usr/bin/env node

/**
 * 환경변수 설정 도우미
 * .env.example을 기반으로 .env 파일 생성
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function generateSecureKey(length = 32) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

async function setupEnvFile() {
  console.log('🔧 Glimpse 환경변수 설정 도우미\n');

  const rootDir = path.resolve(__dirname, '..');
  const examplePath = path.join(rootDir, '.env.example');
  const envPath = path.join(rootDir, '.env');

  // .env 파일이 이미 존재하는지 확인
  if (fs.existsSync(envPath)) {
    const overwrite = await question('.env 파일이 이미 존재합니다. 덮어쓰시겠습니까? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('설정을 취소했습니다.');
      process.exit(0);
    }
  }

  // .env.example 읽기
  if (!fs.existsSync(examplePath)) {
    console.error('❌ .env.example 파일을 찾을 수 없습니다.');
    process.exit(1);
  }

  let envContent = fs.readFileSync(examplePath, 'utf8');

  console.log('\n환경을 선택해주세요:');
  console.log('1. 개발 (Development)');
  console.log('2. 스테이징 (Staging)');
  console.log('3. 프로덕션 (Production)');
  
  const envChoice = await question('\n선택 (1-3): ');
  const environment = ['development', 'staging', 'production'][parseInt(envChoice) - 1] || 'development';

  // NODE_ENV 설정
  envContent = envContent.replace('NODE_ENV=development', `NODE_ENV=${environment}`);

  // 자동 생성 가능한 보안 키들
  console.log('\n🔐 보안 키 생성중...');
  
  const jwtSecret = await generateSecureKey(64);
  const encryptionKey = await generateSecureKey(32);
  
  envContent = envContent.replace('JWT_SECRET=your_jwt_secret_here_min_32_chars', `JWT_SECRET=${jwtSecret}`);
  envContent = envContent.replace('ENCRYPTION_KEY=your_encryption_key_here_32_chars', `ENCRYPTION_KEY=${encryptionKey}`);

  // 데이터베이스 설정
  console.log('\n💾 데이터베이스 설정');
  const useLocalDb = await question('로컬 데이터베이스를 사용하시겠습니까? (Y/n): ');
  
  if (useLocalDb.toLowerCase() !== 'n') {
    console.log('✅ 로컬 데이터베이스 설정을 유지합니다.');
  } else {
    const dbUrl = await question('데이터베이스 URL을 입력하세요: ');
    envContent = envContent.replace(
      'DATABASE_URL="postgresql://glimpse:glimpse_password@localhost:5432/glimpse_db"',
      `DATABASE_URL="${dbUrl}"`
    );
  }

  // API URL 설정
  if (environment === 'production') {
    const apiDomain = await question('\n🌐 프로덕션 API 도메인을 입력하세요 (예: api.glimpse.dating): ');
    if (apiDomain) {
      envContent = envContent.replace(/API_URL=http:\/\/localhost:3001/g, `API_URL=https://${apiDomain}`);
      envContent = envContent.replace(/EXPO_PUBLIC_API_URL=http:\/\/localhost:3001/g, `EXPO_PUBLIC_API_URL=https://${apiDomain}`);
      envContent = envContent.replace(/NEXT_PUBLIC_API_URL=http:\/\/localhost:3001/g, `NEXT_PUBLIC_API_URL=https://${apiDomain}`);
      envContent = envContent.replace(/EXPO_PUBLIC_WEBSOCKET_URL=ws:\/\/localhost:3001/g, `EXPO_PUBLIC_WEBSOCKET_URL=wss://${apiDomain}`);
    }
  }

  // 각 서비스별 .env 파일 생성
  console.log('\n📁 환경변수 파일 생성중...');

  // 루트 .env
  fs.writeFileSync(envPath, envContent);
  console.log('✅ /.env 생성됨');

  // 서버 .env
  const serverEnvPath = path.join(rootDir, 'server', '.env');
  fs.writeFileSync(serverEnvPath, envContent);
  console.log('✅ /server/.env 생성됨');

  // 모바일 .env
  const mobileEnvContent = envContent
    .split('\n')
    .filter(line => line.startsWith('EXPO_PUBLIC_') || line.startsWith('#') || line === '')
    .join('\n');
  
  const mobileEnvPath = path.join(rootDir, 'mobile', '.env');
  fs.writeFileSync(mobileEnvPath, mobileEnvContent);
  console.log('✅ /mobile/.env 생성됨');

  // 웹 .env.local
  const webEnvContent = envContent
    .split('\n')
    .filter(line => line.startsWith('NEXT_PUBLIC_') || line.startsWith('#') || line === '')
    .join('\n');
  
  const webEnvPath = path.join(rootDir, 'web', '.env.local');
  fs.writeFileSync(webEnvPath, webEnvContent);
  console.log('✅ /web/.env.local 생성됨');

  console.log('\n✨ 환경변수 설정이 완료되었습니다!');
  console.log('\n⚠️  중요: 실제 서비스 키들(Clerk, Stripe 등)은 직접 입력해주세요.');
  console.log('📝 각 .env 파일을 열어 필요한 값들을 채워주세요.\n');

  rl.close();
}

// 실행
setupEnvFile().catch(console.error);