#!/bin/bash

# Railway PostgreSQL 연결 설정 스크립트

echo "🚄 Railway PostgreSQL 설정 시작..."
echo ""

# 현재 작업 디렉토리 확인
if [ ! -f "server/prisma/schema.prisma" ]; then
    echo "❌ 에러: server/prisma/schema.prisma 파일을 찾을 수 없습니다."
    echo "glimpse 프로젝트 루트 디렉토리에서 실행하세요."
    exit 1
fi

echo "📋 Railway 설정 가이드:"
echo "1. https://railway.app/ 에서 계정 생성"
echo "2. New Project → Provision PostgreSQL 선택"
echo "3. PostgreSQL 서비스 → Connect → Postgres Connection URL 복사"
echo ""

# 환경 변수 확인
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL 환경 변수가 설정되지 않았습니다."
    echo ""
    echo "설정 방법:"
    echo "export DATABASE_URL=\"postgresql://postgres:password@server.railway.app:5432/railway\""
    echo ""
    echo "Railway에서 복사한 URL로 환경 변수를 설정한 후 다시 실행하세요."
    exit 1
fi

# Railway URL 패턴 확인
if [[ "$DATABASE_URL" == *"railway.app"* ]]; then
    echo "✅ Railway PostgreSQL URL 확인됨"
    echo "연결 대상: $(echo $DATABASE_URL | sed 's/:[^@]*@/:***@/g')"
elif [[ "$DATABASE_URL" == *"localhost"* ]]; then
    echo "⚠️  localhost URL이 설정되어 있습니다. Railway URL을 사용하세요."
    exit 1
elif [[ "$DATABASE_URL" == *"supabase"* ]]; then
    echo "⚠️  Supabase URL이 설정되어 있습니다. Railway URL을 사용하세요."
    exit 1
else
    echo "✅ PostgreSQL URL 확인됨 (Railway 외부 서버)"
    echo "연결 대상: $(echo $DATABASE_URL | sed 's/:[^@]*@/:***@/g')"
fi

echo ""

# 서버 디렉토리로 이동
cd server

echo "🔧 Prisma 클라이언트 생성 중..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Prisma 클라이언트 생성 실패"
    exit 1
fi

echo "✅ Prisma 클라이언트 생성 완료"
echo ""

echo "🔍 데이터베이스 연결 테스트 중..."
npx prisma db pull > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ 데이터베이스 연결 성공!"
else
    echo "⚠️  데이터베이스 연결 테스트 실패. 계속 진행합니다..."
fi

echo ""
echo "📊 데이터베이스 스키마 적용 중..."
npx prisma db push

if [ $? -ne 0 ]; then
    echo "❌ 데이터베이스 마이그레이션 실패"
    echo ""
    echo "가능한 원인:"
    echo "1. Railway URL이 잘못되었을 수 있습니다"
    echo "2. 네트워크 연결 문제"
    echo "3. 데이터베이스 권한 문제"
    echo ""
    echo "Railway Dashboard에서 연결 정보를 다시 확인하세요."
    exit 1
fi

echo "✅ 데이터베이스 마이그레이션 완료!"
echo ""

echo "🎉 Railway PostgreSQL 설정 성공!"
echo ""
echo "다음 단계:"
echo "1. Vercel 환경 변수에 다음 URL 설정:"
echo "   DATABASE_URL=$(echo $DATABASE_URL)"
echo ""
echo "2. Vercel 재배포 대기 (1-2분)"
echo ""
echo "3. API 테스트:"
echo "   https://glimpse-server-psi.vercel.app/api/db-status"
echo "   https://glimpse-server-psi.vercel.app/api/groups"
echo ""
echo "4. Mobile 앱 테스트:"
echo "   https://glimpse-mobile.vercel.app/"
echo ""
echo "Railway Dashboard: https://railway.app/dashboard"