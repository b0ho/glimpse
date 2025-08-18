#!/bin/bash

# Railway 외부 연결 테스트 스크립트
echo "🚄 Railway 외부 연결 테스트..."

# 새로운 Railway URL 설정
export DATABASE_URL="postgresql://postgres:SEdfKLgSMpUJdtfoovErEipammyyHGxL@shinkansen.proxy.rlwy.net:16553/railway"

echo "✅ 연결 URL: $(echo $DATABASE_URL | sed 's/:[^@]*@/:***@/g')"
echo ""

cd server

echo "🔧 Prisma 클라이언트 생성..."
npx prisma generate

echo ""
echo "🔍 데이터베이스 연결 테스트..."
npx prisma db pull > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Railway 외부 연결 성공!"
else
    echo "❌ 연결 실패 - URL 확인 필요"
    exit 1
fi

echo ""
echo "📊 데이터베이스 스키마 생성..."
npx prisma db push

if [ $? -eq 0 ]; then
    echo "✅ 스키마 생성 완료!"
else
    echo "❌ 스키마 생성 실패"
    exit 1
fi

echo ""
echo "🎉 Railway 설정 완료!"
echo ""
echo "다음 단계:"
echo "1. Vercel 환경변수 업데이트:"
echo "   DATABASE_URL=postgresql://postgres:SEdfKLgSMpUJdtfoovErEipammyyHGxL@shinkansen.proxy.rlwy.net:16553/railway"
echo ""
echo "2. API 테스트:"
echo "   https://glimpse-server-psi.vercel.app/api/db-status"