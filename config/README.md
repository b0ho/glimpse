# Glimpse 환경 변수 설정 가이드

## 📁 디렉토리 구조

```
config/
├── public/                    # 공개 설정 (Git으로 관리)
│   ├── api.config.js         # API 엔드포인트 설정
│   ├── app.config.js         # 앱 기능 및 비즈니스 설정
│   └── mobile.config.js      # 모바일 앱 전용 설정
├── private/                  # 비밀 설정 (Git 무시됨)
│   ├── secrets.env           # 실제 비밀키들 (직접 생성)
│   ├── .env.local           # 개인 로컬 설정 (선택사항)
│   └── .env.{environment}   # 환경별 비밀 설정
├── examples/                 # 예제 파일들
│   └── secrets.env.example  # 비밀 설정 템플릿
├── env-loader.js            # 환경 변수 로더
└── README.md               # 이 파일
```

## 🚀 설정 방법

### 1단계: 비밀 설정 파일 생성

```bash
# config/private 폴더 생성
mkdir -p config/private

# 예제 파일을 복사하여 실제 설정 파일 생성
cp config/examples/secrets.env.example config/private/secrets.env
```

### 2단계: 실제 값들 입력

`config/private/secrets.env` 파일을 열어 실제 API 키와 비밀값들을 입력하세요.

## 🔒 보안 규칙

### ✅ Git으로 관리되는 것 (공개 가능)
- `config/public/` - 모든 공개 설정 파일들
- `.env.defaults` - 기본 설정값들  
- `config/examples/` - 예제 파일들

### ❌ Git에서 제외되는 것 (비밀 정보)
- `config/private/` - 모든 비밀 설정 파일들
- 루트의 `.env*` 파일들
- `mobile/.env`, `server/.env` - 레거시 환경 파일들

ENDOFFILE < /dev/null