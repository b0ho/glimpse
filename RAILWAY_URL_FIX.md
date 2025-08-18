# 🚄 Railway URL 수정 가이드

## 문제 상황
현재 설정된 URL이 **내부 네트워크용**입니다:
```
postgresql://postgres:SEdfKLgSMpUJdtfoovErEipammyyHGxL@postgres.railway.internal:5432/railway
```

## ✅ 해결 방법

### 1. Railway Dashboard에서 올바른 URL 찾기

1. **Railway Dashboard 접속**: https://railway.app/dashboard
2. **PostgreSQL 서비스 클릭**
3. **"Connect" 탭** 선택
4. **"Public Network URL"** 또는 **"External URL"** 찾기

### 2. 올바른 URL 형식
```bash
# ❌ 잘못된 URL (내부용)
postgresql://postgres:password@postgres.railway.internal:5432/railway

# ✅ 올바른 URL (외부용) 
postgresql://postgres:password@viaduct.proxy.rlwy.net:12345/railway
```

### 3. Vercel 환경변수 업데이트

**새로운 URL로 교체하세요:**
```
https://vercel.com/b0hos-projects/glimpse-server/settings/environments
```

DATABASE_URL을 외부 연결용 URL로 변경:
```
postgresql://postgres:SEdfKLgSMpUJdtfoovErEipammyyHGxL@[EXTERNAL_HOST]:[PORT]/railway
```

### 4. 로컬에서 마이그레이션 실행

새로운 URL로 로컬에서 스키마 생성:
```bash
# 외부 연결용 URL로 설정
export DATABASE_URL="postgresql://postgres:SEdfKLgSMpUJdtfoovErEipammyyHGxL@[EXTERNAL_HOST]:[PORT]/railway"

# 마이그레이션 실행
./setup-railway.sh
```

## 🔍 Railway URL 찾는 상세 방법

### Connect 탭에서 찾을 수 있는 정보:
- **Database URL** (내부용)
- **Public URL** (외부용) ⭐ **이것 사용**
- **TCP Proxy URL** (외부용) ⭐ **또는 이것**

### 일반적인 Railway 외부 URL 패턴:
```
postgresql://postgres:password@viaduct.proxy.rlwy.net:PORT/railway
postgresql://postgres:password@roundhouse.proxy.rlwy.net:PORT/railway  
postgresql://postgres:password@containers-us-west-XXX.railway.app:5432/railway
```

## ⚠️ 주의사항

1. **Internal URL은 사용 불가**: `railway.internal`은 Railway 내부에서만 접근 가능
2. **포트 번호 확인**: 외부 연결은 보통 5432가 아닌 다른 포트 사용
3. **비밀번호 동일**: 비밀번호는 그대로 사용 (`SEdfKLgSMpUJdtfoovErEipammyyHGxL`)

## 🎯 다음 단계

1. Railway Dashboard에서 외부 URL 복사
2. Vercel 환경변수 업데이트
3. 로컬에서 `./setup-railway.sh` 실행
4. API 테스트로 확인

**올바른 외부 URL을 찾으면 알려주세요!** 🚀