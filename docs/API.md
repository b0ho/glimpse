# 📚 Glimpse API Documentation

## Overview

Glimpse API는 RESTful 원칙을 따르며, JSON 형식으로 데이터를 주고받습니다.

## Base URLs

- **Development**: `http://localhost:3001/api/v1`
- **Production**: `https://api.glimpse.app/api/v1`

## Interactive Documentation

Swagger UI를 통해 API를 직접 테스트할 수 있습니다:
- **Development**: http://localhost:3001/api-docs
- **Production**: https://api.glimpse.app/api-docs

## Authentication

모든 API 요청은 Clerk에서 발급한 JWT 토큰이 필요합니다.

```
Authorization: Bearer <your-jwt-token>
```

### 토큰 획득 방법

1. Clerk를 통한 휴대폰 인증
2. SMS 인증 코드 확인
3. JWT 토큰 발급

## API Endpoints

### 🔐 Authentication

#### POST /auth/verify-phone
휴대폰 번호 인증 요청

**Request Body:**
```json
{
  "phoneNumber": "010-1234-5678"
}
```

**Response:**
```json
{
  "message": "인증 코드가 발송되었습니다",
  "expiresIn": 300
}
```

#### POST /auth/verify-sms
SMS 인증 코드 확인

**Request Body:**
```json
{
  "phoneNumber": "010-1234-5678",
  "code": "123456"
}
```

**Response:**
```json
{
  "token": "eyJ...",
  "user": {
    "id": "uuid",
    "phoneNumber": "010-1234-5678",
    "isNewUser": true
  }
}
```

### 👤 Users

#### GET /users/me
현재 사용자 정보 조회

**Response:**
```json
{
  "id": "uuid",
  "anonymousId": "anon_123",
  "nickname": "김철수",
  "age": 28,
  "gender": "MALE",
  "bio": "안녕하세요",
  "credits": 5,
  "isPremium": false,
  "isVerified": true
}
```

#### PUT /users/profile
프로필 업데이트

**Request Body:**
```json
{
  "nickname": "김철수",
  "age": 28,
  "bio": "안녕하세요",
  "profileImage": "https://..."
}
```

### 👥 Groups

#### GET /groups
그룹 목록 조회

**Query Parameters:**
- `type`: OFFICIAL | CREATED | INSTANCE | LOCATION
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20)

**Response:**
```json
{
  "groups": [
    {
      "id": "uuid",
      "name": "삼성전자",
      "type": "OFFICIAL",
      "memberCount": 1234,
      "description": "삼성전자 임직원 그룹"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### POST /groups/{groupId}/join
그룹 가입

**Response:**
```json
{
  "message": "그룹에 가입되었습니다",
  "membership": {
    "id": "uuid",
    "role": "MEMBER",
    "joinedAt": "2025-01-24T10:00:00Z"
  }
}
```

### 💕 Likes & Matches

#### POST /likes
좋아요 보내기

**Request Body:**
```json
{
  "toUserId": "uuid",
  "groupId": "uuid",
  "isSuper": false
}
```

**Response:**
```json
{
  "message": "좋아요를 보냈습니다",
  "creditsRemaining": 4,
  "isMatch": false
}
```

#### GET /matches
매치 목록 조회

**Response:**
```json
{
  "matches": [
    {
      "id": "uuid",
      "matchedUser": {
        "id": "uuid",
        "nickname": "김영희",
        "age": 26,
        "profileImage": "https://..."
      },
      "groupName": "삼성전자",
      "matchedAt": "2025-01-24T10:00:00Z",
      "lastMessageAt": null
    }
  ]
}
```

### 💬 Chat

#### GET /chat/messages/{matchId}
메시지 조회

**Query Parameters:**
- `limit`: 메시지 개수 (기본값: 50)
- `before`: 이 시간 이전 메시지

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "senderId": "uuid",
      "content": "안녕하세요!",
      "type": "TEXT",
      "createdAt": "2025-01-24T10:00:00Z",
      "readAt": null
    }
  ]
}
```

#### POST /chat/messages
메시지 전송

**Request Body:**
```json
{
  "matchId": "uuid",
  "content": "안녕하세요!",
  "type": "TEXT"
}
```

### 💳 Payments

#### POST /payments/premium
프리미엄 구독

**Request Body:**
```json
{
  "plan": "MONTHLY",
  "paymentMethod": "CARD",
  "paymentMethodId": "pm_..."
}
```

**Response:**
```json
{
  "subscription": {
    "id": "sub_...",
    "status": "active",
    "currentPeriodEnd": "2025-02-24T10:00:00Z"
  }
}
```

#### POST /payments/credits
크레딧 구매

**Request Body:**
```json
{
  "package": "MEDIUM",
  "paymentMethod": "KAKAO_PAY"
}
```

**Response:**
```json
{
  "redirectUrl": "https://pay.kakao.com/...",
  "paymentId": "uuid"
}
```

## Error Handling

모든 에러 응답은 다음 형식을 따릅니다:

```json
{
  "error": "에러 메시지",
  "code": "ERROR_CODE",
  "details": {
    "field": "추가 정보"
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | 인증 토큰이 없거나 유효하지 않음 |
| `FORBIDDEN` | 권한 없음 |
| `NOT_FOUND` | 리소스를 찾을 수 없음 |
| `VALIDATION_ERROR` | 입력값 검증 실패 |
| `INSUFFICIENT_CREDITS` | 크레딧 부족 |
| `ALREADY_LIKED` | 이미 좋아요를 보냄 |
| `COOLDOWN_ACTIVE` | 쿨다운 기간 중 |
| `PAYMENT_FAILED` | 결제 실패 |

## Rate Limiting

API 요청은 다음과 같이 제한됩니다:

- **인증 API**: 15분당 5회
- **일반 API**: 15분당 100회
- **결제 API**: 1분당 10회

Rate limit 정보는 응답 헤더에 포함됩니다:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1706090400
```

## WebSocket Events

실시간 기능은 Socket.IO를 사용합니다.

### Connection
```javascript
const socket = io('wss://api.glimpse.app', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events

#### 메시지 수신
```javascript
socket.on('new-message', (data) => {
  console.log('New message:', data.message);
});
```

#### 타이핑 표시
```javascript
// 전송
socket.emit('typing', { matchId: 'uuid', isTyping: true });

// 수신
socket.on('user-typing', (data) => {
  console.log(`User ${data.userId} is typing`);
});
```

## SDK & Examples

### JavaScript/TypeScript
```typescript
import { GlimpseClient } from '@glimpse/sdk';

const client = new GlimpseClient({
  apiKey: 'your-api-key',
  environment: 'production'
});

// 사용자 정보 조회
const user = await client.users.getCurrentUser();

// 좋아요 보내기
const result = await client.likes.send({
  toUserId: 'uuid',
  groupId: 'uuid'
});
```

### React Native
```typescript
import { GlimpseProvider, useGlimpse } from '@glimpse/react-native';

function App() {
  return (
    <GlimpseProvider apiKey="your-api-key">
      <YourApp />
    </GlimpseProvider>
  );
}

function YourComponent() {
  const { user, sendLike } = useGlimpse();
  // ...
}
```

## Postman Collection

Postman collection을 다운로드하여 API를 테스트할 수 있습니다:
[Download Postman Collection](https://api.glimpse.app/postman-collection.json)

## Support

API 관련 문의사항은 다음 채널을 이용해주세요:
- Email: api-support@glimpse.app
- Developer Portal: https://developers.glimpse.app
- GitHub Issues: https://github.com/glimpse-app/api-issues