# Glimpse Mobile App

## 개발 환경 설정

### 필수 요구사항
- Node.js 18+
- Expo CLI
- Expo Go 앱 (iOS/Android)

### 시작하기

1. **환경 변수 설정**
   ```bash
   cp .env.example .env
   # .env 파일에서 필요한 값 설정
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **개발 서버 시작**
   ```bash
   npx expo start
   ```

4. **Expo Go로 실행**
   - Expo Go 앱을 스마트폰에 설치
   - 터미널에 표시된 QR 코드 스캔
   - 또는 같은 네트워크에서 exp://[YOUR_IP]:8081 접속

### 웹에서 테스트 (제한적)
```bash
npx expo start --web
```
- 웹 버전은 일부 네이티브 기능이 제한됩니다
- Mock 구현으로 기본 동작만 확인 가능

### 주요 화면
- **AuthScreen**: 로그인/회원가입
- **HomeScreen**: 메인 피드
- **GroupsScreen**: 그룹 목록
- **MatchesScreen**: 매칭 관리
- **ChatScreen**: 실시간 채팅
- **ProfileScreen**: 프로필 관리

### 문제 해결

#### Metro 번들러 오류
```bash
npx expo start --clear
```

#### 네트워크 연결 문제
- 백엔드 서버가 실행 중인지 확인 (http://localhost:8000)
- .env의 API_URL이 올바른지 확인
- 같은 네트워크에 있는지 확인

#### 웹 실행 시 오류
- 네이티브 모듈은 웹에서 지원되지 않음
- utils/mocks 폴더의 mock 구현 확인