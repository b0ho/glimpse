# 설정 파일 가이드

이 디렉토리는 프로젝트의 환경 변수 예제와 설정 파일들을 포함합니다.

## env-examples/

환경 변수 예제 파일들:

- `.env.example` - 개발 환경 변수 예제
- `.env.docker.example` - Docker 환경 변수 예제  
- `.env.production.example` - 프로덕션 환경 변수 예제

### 사용 방법

1. 필요한 예제 파일을 프로젝트 루트로 복사:
   ```bash
   cp config/env-examples/.env.example .env
   ```

2. 실제 값으로 수정:
   ```bash
   vi .env
   ```

## 주의사항

- 실제 환경 변수 파일(`.env`, `.env.local` 등)은 절대 커밋하지 마세요
- 민감한 정보(API 키, 비밀번호 등)는 반드시 환경 변수로 관리하세요
- 새로운 환경 변수를 추가할 때는 해당 예제 파일도 업데이트하세요