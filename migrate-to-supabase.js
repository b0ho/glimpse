#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// Supabase 프로젝트 정보
const SUPABASE_PROJECT_REF = 'bjcpljuhjibvpajkrysj';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;

async function migrateToSupabase() {
  console.log('🚀 Supabase 마이그레이션 시작...');
  
  try {
    // 1. 환경 변수 확인
    console.log('📋 환경 변수 확인 중...');
    
    // Supabase DATABASE_URL 생성 (사용자가 비밀번호를 입력해야 함)
    console.log(`
⚠️  중요: Supabase 데이터베이스 연결을 위해 다음 정보가 필요합니다:

1. Supabase Dashboard에서 Settings > Database > Connection string 확인
2. Direct connection 또는 Connection pooling URL 복사
3. 비밀번호를 실제 값으로 교체

예시 URL:
- Direct: postgresql://postgres:[YOUR-PASSWORD]@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres
- Pooling: postgresql://postgres:[YOUR-PASSWORD]@db.${SUPABASE_PROJECT_REF}.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1

현재 프로젝트: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/settings/database
`);

    // 2. .env 파일 생성
    const envContent = `
# Supabase Database Connection
# 실제 비밀번호로 [YOUR-PASSWORD]를 교체하세요
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.${SUPABASE_PROJECT_REF}.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"

# Server Configuration
NODE_ENV=production
PORT=3001

# JWT Secret (32자 이상의 랜덤 문자열)
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random_32_chars_minimum

# Encryption Key (32 bytes hex)
ENCRYPTION_KEY=c55bb6a39f66e80e5601d53d25a5e9d3cf64397655eedfff7efd10964db4246f

# Clerk Authentication (실제 키로 교체)
CLERK_SECRET_KEY=sk_live_your_production_clerk_secret
CLERK_PUBLISHABLE_KEY=pk_live_your_production_clerk_publishable

# AWS S3 (선택사항)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET_NAME=

# Firebase Admin (선택사항)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Redis (선택사항)
REDIS_URL=

# 프로덕션 설정
DEV_AUTH_ENABLED=false
`;

    const envPath = path.join(__dirname, 'server', '.env.production');
    await fs.writeFile(envPath, envContent.trim());
    console.log('✅ .env.production 파일 생성됨');

    // 3. Prisma 클라이언트 생성
    console.log('🔧 Prisma 클라이언트 생성 중...');
    process.chdir(path.join(__dirname, 'server'));
    
    await execAsync('npx prisma generate');
    console.log('✅ Prisma 클라이언트 생성 완료');

    // 4. 환경 변수 설정 안내
    console.log(`
📝 다음 단계를 수행하세요:

1. Supabase 대시보드에서 데이터베이스 비밀번호 확인:
   https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/settings/database

2. .env.production 파일의 [YOUR-PASSWORD]를 실제 비밀번호로 교체

3. 다음 명령어로 마이그레이션 실행:
   DOTENV_CONFIG_PATH=.env.production npx prisma db push

4. Vercel 환경 변수 설정:
   - DATABASE_URL (Supabase 연결 문자열)
   - JWT_SECRET (32자 이상)
   - ENCRYPTION_KEY (현재 값 유지)
   - CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY (실제 키)

5. Vercel 재배포 후 확인:
   https://glimpse-server-psi.vercel.app/api/db-status
`);

    console.log('🎉 Supabase 마이그레이션 준비 완료!');
    
  } catch (error) {
    console.error('❌ 마이그레이션 준비 실패:', error);
    console.error(error.message);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  migrateToSupabase();
}

module.exports = { migrateToSupabase };