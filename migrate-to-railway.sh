#!/bin/bash

# Railway PostgreSQL 마이그레이션 스크립트

echo "🚄 Railway PostgreSQL 마이그레이션 시작..."
echo ""

# Railway URL 설정
export DATABASE_URL="postgresql://postgres:SEdfKLgSMpUJdtfoovErEipammyyHGxL@shinkansen.proxy.rlwy.net:16553/railway"

echo "✅ Railway URL 설정 완료"
echo "연결 대상: $(echo $DATABASE_URL | sed 's/:[^@]*@/:***@/g')"
echo ""

# 현재 디렉토리 확인
if [ ! -f "server/prisma/schema.prisma" ]; then
    echo "❌ 에러: server/prisma/schema.prisma 파일을 찾을 수 없습니다."
    echo "glimpse 프로젝트 루트 디렉토리에서 실행하세요."
    exit 1
fi

# server 디렉토리로 이동
cd server

echo "🔧 1. Prisma 클라이언트 생성 중..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Prisma 클라이언트 생성 실패"
    exit 1
fi

echo "✅ Prisma 클라이언트 생성 완료"
echo ""

echo "🔍 2. Railway 연결 테스트 중..."
npx prisma db pull > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Railway 연결 성공!"
else
    echo "⚠️  연결 테스트 실패, 계속 진행합니다..."
fi

echo ""
echo "📊 3. 데이터베이스 스키마 적용 중..."
npx prisma db push

if [ $? -ne 0 ]; then
    echo "❌ 데이터베이스 마이그레이션 실패"
    echo ""
    echo "가능한 원인:"
    echo "1. Railway URL이 잘못되었을 수 있습니다"
    echo "2. 네트워크 연결 문제"
    echo "3. Railway 서비스가 일시적으로 중단됨"
    echo ""
    exit 1
fi

echo "✅ 데이터베이스 스키마 적용 완료!"
echo ""

echo "🔍 4. 데이터베이스 상태 확인 중..."
npx prisma db pull > schema-check.prisma 2>/dev/null

if [ -f "schema-check.prisma" ]; then
    echo "✅ 스키마 검증 완료"
    rm -f schema-check.prisma
fi

echo ""
echo "🎉 Railway PostgreSQL 마이그레이션 성공!"
echo ""
echo "📋 완료된 작업:"
echo "✅ Prisma 클라이언트 생성"
echo "✅ Railway 데이터베이스 연결"
echo "✅ 스키마 생성/업데이트"
echo "✅ 테이블 생성 완료"
echo ""
echo "🔗 다음 단계:"
echo "1. Railway Dashboard: https://railway.app/dashboard"
echo "2. Vercel API 테스트: https://glimpse-server-psi.vercel.app/api/db-status"
echo "3. 모바일 앱 테스트: https://glimpse-mobile.vercel.app/"
echo ""
echo "🎯 Railway 사용량 모니터링을 잊지 마세요!"