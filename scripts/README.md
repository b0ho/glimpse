# 📚 Glimpse 개발 환경 스크립트 가이드

## 🎯 스크립트 용도별 구분

### 1️⃣ `init-local-dev.sh` - 초기 설정
**언제 사용?**
- 🆕 처음 프로젝트를 clone 받았을 때
- 🔄 데이터베이스를 완전히 초기화하고 싶을 때
- 🐛 문제가 발생해서 처음부터 다시 설정하고 싶을 때

**수행 작업:**
- ✅ 모든 기존 프로세스 종료
- ✅ Docker 컨테이너 생성 (없으면 새로 만들기)
- ✅ 데이터베이스 완전 초기화 (force-reset)
- ✅ Prisma 마이그레이션
- ✅ 서버와 앱 시작

```bash
./scripts/init-local-dev.sh
```

---

### 2️⃣ `start-local-dev.sh` - 빠른 시작
**언제 사용?**
- 🚀 이미 설정된 환경을 다시 시작할 때
- 💻 컴퓨터를 재부팅한 후
- ☕ 아침에 개발을 시작할 때

**수행 작업:**
- ✅ Docker 컨테이너 시작 (이미 있으면 재사용)
- ✅ 서버 시작 (실행 중이면 선택적 재시작)
- ✅ Mobile 앱 시작 (실행 중이면 선택적 재시작)
- ❌ 데이터베이스는 건드리지 않음 (기존 데이터 유지)

```bash
./scripts/start-local-dev.sh
```

---

### 3️⃣ `stop-local-dev.sh` - 종료
**언제 사용?**
- 🛑 개발을 끝내고 리소스를 정리할 때
- 💾 서버와 앱만 종료하고 싶을 때

**수행 작업:**
- ✅ 서버와 Mobile 앱 프로세스 종료
- ❓ Docker 컨테이너 종료 (선택적)

```bash
./scripts/stop-local-dev.sh
```

---

### 4️⃣ `reset-local-dev.sh` - 완전 초기화
**언제 사용?**
- 🆘 심각한 문제가 발생했을 때
- 🧹 모든 것을 깨끗하게 정리하고 싶을 때
- 📦 node_modules까지 재설치하고 싶을 때

**수행 작업:**
- ✅ 모든 프로세스 강제 종료
- ✅ Docker 컨테이너 완전 삭제 및 재생성
- ✅ 캐시 및 임시 파일 삭제
- ❓ node_modules 재설치 (선택적)

```bash
./scripts/reset-local-dev.sh
```

---

## 🎮 일반적인 사용 시나리오

### 시나리오 1: 처음 시작
```bash
# 1. 프로젝트 clone
git clone [repository-url]
cd glimpse-fe

# 2. 패키지 설치
npm install

# 3. 환경 초기화
./scripts/init-local-dev.sh

# 4. 브라우저에서 http://localhost:8081 열기
```

### 시나리오 2: 일상적인 개발
```bash
# 아침에 개발 시작
./scripts/start-local-dev.sh

# 개발...

# 저녁에 종료
./scripts/stop-local-dev.sh
```

### 시나리오 3: 문제 해결
```bash
# 가벼운 문제 (서버 재시작)
./scripts/stop-local-dev.sh
./scripts/start-local-dev.sh

# 중간 문제 (DB 초기화)
./scripts/init-local-dev.sh

# 심각한 문제 (완전 초기화)
./scripts/reset-local-dev.sh
./scripts/init-local-dev.sh
```

---

## 🤔 FAQ

### Q: init과 start의 차이는?
**A:** 
- `init`: 환경을 처음부터 설정 (DB 초기화 포함)
- `start`: 기존 환경을 그대로 시작 (DB 데이터 유지)

### Q: 데이터를 유지하면서 서버만 재시작하려면?
**A:** `start-local-dev.sh` 사용. 서버가 실행 중이면 재시작 여부를 물어봅니다.

### Q: Docker 컨테이너만 종료하려면?
**A:** `stop-local-dev.sh` 실행 시 Docker 종료 여부를 선택할 수 있습니다.

### Q: 포트 충돌이 발생하면?
**A:** `start-local-dev.sh`는 기존 서비스를 유지합니다. 강제로 재시작하려면 `init-local-dev.sh` 사용.

---

## 📊 스크립트 비교표

| 스크립트 | 프로세스 종료 | Docker 재생성 | DB 초기화 | 데이터 유지 | 사용 시점 |
|---------|-------------|--------------|----------|-----------|----------|
| `init` | ✅ 전체 | ✅ 필요시 | ✅ 항상 | ❌ | 처음/리셋 |
| `start` | ❌ 선택적 | ❌ | ❌ | ✅ | 일상 개발 |
| `stop` | ✅ 앱만 | ❌ | ❌ | ✅ | 작업 종료 |
| `reset` | ✅ 전체 | ✅ 항상 | ✅ 항상 | ❌ | 문제 해결 |

---

## 💡 팁

1. **빠른 재시작**: `start` 스크립트는 이미 실행 중인 서비스를 건드리지 않으므로 빠릅니다.
2. **데이터 보존**: 테스트 데이터를 유지하려면 `start`를 사용하세요.
3. **깨끗한 시작**: 매일 아침 `init`으로 시작하면 깨끗한 환경에서 개발할 수 있습니다.
4. **로그 확인**: `start` 실행 후 로그 모니터링 옵션을 사용하면 편리합니다.

---

## 🆘 문제 해결 순서

1. `start-local-dev.sh` - 대부분의 경우 해결
2. `stop-local-dev.sh` → `start-local-dev.sh` - 프로세스 문제
3. `init-local-dev.sh` - DB나 설정 문제
4. `reset-local-dev.sh` → `init-local-dev.sh` - 심각한 문제

---

**Happy Coding! 🚀**