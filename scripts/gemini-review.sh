#!/bin/bash

# Gemini 검증 자동화 스크립트
# CLAUDE.md 필수 프로세스 자동화

echo "🔍 CLAUDE.md 필수 프로세스 시작..."
echo "1. 구현 완료 ✅"
echo "2. Gemini CLI 검사 진행 중..."

# Gemini CLI 검사 실행
echo "📊 Gemini로 코드 품질 검사 중..."
gemini -p "@src/ 최근 구현한 기능을 검토해주세요. 코드 품질, 접근성, TypeScript 완전성, 비즈니스 로직 정확성을 중심으로 50점 만점 기준으로 평가해주세요."

echo ""
echo "⚠️  CLAUDE에게 알림:"
echo "3. 📝 Gemini 피드백을 검토하고 적용해주세요"
echo "4. 🚀 피드백 적용 완료 후 커밋을 진행해주세요"
echo ""
echo "🎯 목표 점수: 40+ / 50점 (필수 달성)"
echo "📋 커밋 전 체크리스트:"
echo "   □ npm run typecheck 통과"
echo "   □ npm run lint 통과 (에러 없음)"
echo "   □ Gemini 검토 완료 및 피드백 적용"
echo "   □ 기능 동작 테스트 완료"