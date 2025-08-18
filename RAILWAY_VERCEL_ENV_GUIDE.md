# 🚄 Railway → Vercel 환경변수 설정 가이드

## Railway에서 제공하는 두 가지 URL

### Railway Dashboard의 Connect 탭에서 확인:

1. **`DATABASE_URL`** (내부용)
   ```
   postgresql://postgres:SEdfKLgSMpUJdtfoovErEipammyyHGxL@postgres.railway.internal:5432/railway
   ```
   - ❌ Railway 내부 네트워크 전용
   - ❌ Vercel에서 접근 불가

2. **`DATABASE_PUBLIC_URL`** (외부용)  
   ```
   postgresql://postgres:SEdfKLgSMpUJdtfoovErEipammyyHGxL@shinkansen.proxy.rlwy.net:16553/railway
   ```
   - ✅ 외부에서 접근 가능
   - ✅ Vercel에서 사용해야 하는 URL

## ⚡ Vercel 환경변수 올바른 설정

### https://vercel.com/b0hos-projects/glimpse-server/settings/environments

```bash
# ✅ 올바른 설정
DATABASE_URL=postgresql://postgres:SEdfKLgSMpUJdtfoovErEipammyyHGxL@shinkansen.proxy.rlwy.net:16553/railway

# ❌ 잘못된 설정 (내부 URL 사용)
DATABASE_URL=postgresql://postgres:SEdfKLgSMpUJdtfoovErEipammyyHGxL@postgres.railway.internal:5432/railway
```

## 🔧 설정 방법

1. **Vercel Dashboard 접속**
2. **Environment Variables** 탭
3. **`DATABASE_URL` 편집**
4. **Value를 PUBLIC_URL 값으로 변경:**
   ```
   postgresql://postgres:SEdfKLgSMpUJdtfoovErEipammyyHGxL@shinkansen.proxy.rlwy.net:16553/railway
   ```
5. **Save** 클릭
6. **재배포 대기** (1-2분)

## 🎯 요약

**Railway → Vercel 매핑:**
```
Railway의 DATABASE_PUBLIC_URL  →  Vercel의 DATABASE_URL
Railway의 DATABASE_URL        →  사용하지 않음
```

**이유:**
- Railway 내부 URL은 Railway 서비스 간에만 사용
- Vercel은 외부 서비스이므로 PUBLIC_URL 필요
- Prisma/Node.js는 `DATABASE_URL` 환경변수를 찾음

이것이 Railway의 표준 구조입니다! 🚄