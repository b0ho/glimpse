#!/bin/bash

# Supabase 마이그레이션 실행 스크립트

echo "🚀 Supabase 마이그레이션 시작..."
echo ""

# 현재 작업 디렉토리 확인
if [ ! -f "server/prisma/schema.prisma" ]; then
    echo "❌ 에러: server/prisma/schema.prisma 파일을 찾을 수 없습니다."
    echo "glimpse 프로젝트 루트 디렉토리에서 실행하세요."
    exit 1
fi

echo "📋 Supabase 프로젝트 정보:"
echo "- 프로젝트 ID: bjcpljuhjibvpajkrysj"
echo "- Dashboard: https://supabase.com/dashboard/project/bjcpljuhjibvpajkrysj"
echo ""

# 환경 변수 확인
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL 환경 변수가 설정되지 않았습니다."
    echo ""
    echo "설정 방법:"
    echo "1. Supabase Dashboard > Settings > Database 접속"
    echo "2. Connection string > Connection pooling 선택"
    echo "3. 다음 명령어로 환경 변수 설정:"
    echo ""
    echo "export DATABASE_URL=\"postgresql://postgres.bjcpljuhjibvpajkrysj:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1\""
    echo ""
    echo "비밀번호를 실제 값으로 교체한 후 다시 실행하세요."
    exit 1
fi

echo "✅ DATABASE_URL 환경 변수 설정됨"
echo "연결 대상: $(echo $DATABASE_URL | sed 's/:[^@]*@/:***@/g')"
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

echo "📊 데이터베이스 스키마 푸시 중..."
npx prisma db push --accept-data-loss

if [ $? -ne 0 ]; then
    echo "❌ 데이터베이스 마이그레이션 실패"
    exit 1
fi

echo "✅ 데이터베이스 마이그레이션 완료!"
echo ""

echo "🔍 연결 테스트 중..."
npx prisma db pull > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ 데이터베이스 연결 성공!"
else
    echo "⚠️  데이터베이스 연결 테스트 실패 (마이그레이션은 완료됨)"
fi

echo ""
echo "🎉 Supabase 마이그레이션 완료!"
echo ""
echo "다음 단계:"
echo "1. Vercel 환경 변수에 DATABASE_URL 설정"
echo "2. 다른 필수 환경 변수들 설정 (JWT_SECRET, CLERK_SECRET_KEY 등)"
echo "3. Vercel 재배포 대기"
echo "4. API 테스트: https://glimpse-server-psi.vercel.app/api/db-status"
echo ""
echo "Supabase Dashboard에서 테이블 확인:"
echo "https://supabase.com/dashboard/project/bjcpljuhjibvpajkrysj/editor"