# Vercel 배포 테스트 및 디버깅 가이드

## 현재 상태
- 배포 URL: https://glimpse-server.vercel.app
- 상태: FUNCTION_INVOCATION_FAILED 에러 발생 중

## 필요한 환경변수 (Vercel Dashboard에 설정 필요)

### 필수 환경변수
```
DATABASE_URL=[Railway/Supabase PostgreSQL URL]
DIRECT_URL=[Direct PostgreSQL URL]
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CLERK_SECRET_KEY=sk_test_ahquE3eARWKYofKL7BQoMLfHl7474tiTuMSm1twG4C
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bGlrZWQtZG9nLTkzLmNsZXJrLmFjY291bnRzLmRlويق
NODE_ENV=production
```

## 디버깅 체크리스트

1. **환경변수 확인**
   - Vercel Dashboard > Settings > Environment Variables
   - DATABASE_URL이 올바르게 설정되었는지 확인
   - CLERK 키들이 설정되었는지 확인

2. **데이터베이스 연결**
   - Railway/Supabase 데이터베이스가 활성화되어 있는지 확인
   - Connection string에 SSL 파라미터 추가 필요할 수 있음
   ```
   ?sslmode=require&pgbouncer=true&connection_limit=1
   ```

3. **Vercel Functions 로그 확인**
   - Vercel Dashboard > Functions > Logs
   - 실시간 에러 메시지 확인

4. **재배포**
   ```bash
   git push origin main
   # 또는
   vercel --prod
   ```

## 테스트 명령어

```bash
# Health check
curl https://glimpse-server.vercel.app/health

# Database health
curl https://glimpse-server.vercel.app/health/db

# API 테스트
curl https://glimpse-server.vercel.app/api/v1/groups \
  -H "x-dev-auth: true"
```

## 로컬 테스트

```bash
# 로컬에서 production 모드로 테스트
NODE_ENV=production npm run build
NODE_ENV=production npm run start:prod
```

## 문제 해결

### FUNCTION_INVOCATION_FAILED 에러
1. 환경변수 누락 - DATABASE_URL 확인
2. 메모리 제한 초과 - maxLambdaSize 증가
3. 타임아웃 - 함수 실행 시간 증가
4. 모듈 로드 실패 - package.json 의존성 확인

### 데이터베이스 연결 실패
1. Connection string 형식 확인
2. SSL 설정 확인
3. IP 화이트리스트 확인 (Supabase/Railway)
4. 데이터베이스 서비스 상태 확인