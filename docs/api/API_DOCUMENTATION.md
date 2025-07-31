# Glimpse API 문서

## 🌐 API 개요

### 기본 정보
- **Base URL**: `https://api.glimpse.app/api/v1`
- **Protocol**: HTTPS (TLS 1.2+)
- **Format**: JSON
- **인증**: Bearer Token (JWT)
- **Rate Limit**: 100 requests/minute

### 인증 헤더
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### 응답 형식
```typescript
// 성공 응답
{
  "success": true,
  "data": { ... },
  "message": "요청이 성공적으로 처리되었습니다"
}

// 에러 응답
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지",
    "details": { ... }
  }
}
```

## 🔐 인증 API

### 회원가입
```http
POST /auth/register
```

**Request Body:**
```json
{
  "phoneNumber": "+821012345678",
  "verificationCode": "123456",
  "nickname": "코딩하는곰돌이",
  "birthYear": 1995,
  "gender": "MALE",
  "interests": ["개발", "영화", "커피"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "nickname": "코딩하는곰돌이",
      "phoneNumber": "+821012345678"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 로그인
```http
POST /auth/login
```

**Request Body:**
```json
{
  "phoneNumber": "+821012345678",
  "verificationCode": "123456"
}
```

### SMS 인증 요청
```http
POST /auth/send-verification
```

**Request Body:**
```json
{
  "phoneNumber": "+821012345678"
}
```

### 토큰 갱신
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

## 👤 사용자 API

### 프로필 조회
```http
GET /users/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "nickname": "코딩하는곰돌이",
    "bio": "백엔드 개발자입니다",
    "interests": ["개발", "영화", "커피"],
    "mbti": "INTJ",
    "profileImageUrl": "https://...",
    "isVerified": true,
    "isPremium": false,
    "stats": {
      "likesSent": 15,
      "likesReceived": 8,
      "matches": 3,
      "friends": 5
    }
  }
}
```

### 프로필 수정
```http
PUT /users/:userId
```

**Request Body:**
```json
{
  "nickname": "새로운닉네임",
  "bio": "프로필 소개글",
  "interests": ["개발", "독서"],
  "mbti": "INTJ",
  "height": 175,
  "bodyType": "NORMAL",
  "drinking": "SOMETIMES",
  "smoking": "NEVER"
}
```

### 프로필 사진 업로드
```http
POST /users/:userId/profile-image
Content-Type: multipart/form-data
```

**Form Data:**
- `image`: 이미지 파일 (최대 10MB, JPG/PNG)

### 받은 좋아요 목록
```http
GET /users/:userId/received-likes
```

**Query Parameters:**
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20)
- `status`: PENDING | ACCEPTED | REJECTED

**Response:**
```json
{
  "success": true,
  "data": {
    "likes": [
      {
        "id": "like_123",
        "fromUser": {
          "anonymousId": "anon_456",
          "nickname": null,  // 익명 상태
          "bio": "개발자입니다",
          "interests": ["개발", "커피"]
        },
        "createdAt": "2024-01-15T10:00:00Z",
        "groupId": "group_789",
        "groupName": "네이버"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45
    }
  }
}
```

### 좋아요 수락/거절
```http
POST /users/:userId/accept-like
POST /users/:userId/reject-like
```

**Request Body:**
```json
{
  "likeId": "like_123"
}
```

## 💕 좋아요 API

### 좋아요 보내기
```http
POST /likes
```

**Request Body:**
```json
{
  "toUserId": "user_456",
  "groupId": "group_789",
  "message": "안녕하세요! (선택사항)"
}
```

### 보낸 좋아요 목록
```http
GET /likes/sent
```

### 좋아요 취소
```http
DELETE /likes/:likeId
```

### 슈퍼 좋아요 보내기
```http
POST /likes/super
```

**Request Body:**
```json
{
  "toUserId": "user_456",
  "groupId": "group_789",
  "message": "특별한 관심을 표현합니다!"
}
```

## 👥 그룹 API

### 그룹 목록 조회
```http
GET /groups
```

**Query Parameters:**
- `type`: OFFICIAL | CREATED | INSTANCE | LOCATION
- `category`: 카테고리 필터
- `search`: 검색어
- `lat`: 위도 (위치 기반 그룹)
- `lng`: 경도 (위치 기반 그룹)
- `radius`: 반경 (미터)

### 그룹 상세 조회
```http
GET /groups/:groupId
```

### 그룹 생성
```http
POST /groups
```

**Request Body:**
```json
{
  "name": "영화 동호회",
  "description": "영화를 좋아하는 사람들의 모임",
  "type": "CREATED",
  "category": "HOBBY",
  "isPublic": true,
  "maxMembers": 100,
  "tags": ["영화", "문화생활"]
}
```

### 그룹 가입
```http
POST /groups/:groupId/join
```

**Request Body (공식 그룹의 경우):**
```json
{
  "verificationEmail": "user@company.com",
  "verificationCode": "123456"
}
```

### 그룹 멤버 목록
```http
GET /groups/:groupId/members
```

**Query Parameters:**
- `gender`: MALE | FEMALE
- `ageMin`: 최소 나이
- `ageMax`: 최대 나이
- `interests`: 관심사 필터 (쉼표 구분)

## 💬 매칭 & 채팅 API

### 매칭 목록
```http
GET /matches
```

**Response:**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": "match_123",
        "matchedUser": {
          "id": "user_456",
          "nickname": "디자인하는펭귄",
          "profileImageUrl": "https://...",
          "lastActive": "2024-01-15T10:00:00Z"
        },
        "chatRoomId": "chat_789",
        "matchedAt": "2024-01-14T15:30:00Z",
        "lastMessage": {
          "content": "안녕하세요!",
          "sentAt": "2024-01-15T09:00:00Z",
          "isRead": false
        }
      }
    ]
  }
}
```

### 채팅방 목록
```http
GET /chats
```

### 메시지 목록
```http
GET /chats/:chatRoomId/messages
```

**Query Parameters:**
- `before`: 특정 시간 이전 메시지
- `limit`: 가져올 메시지 수 (기본값: 50)

### 메시지 전송
```http
POST /chats/:chatRoomId/messages
```

**Request Body:**
```json
{
  "content": "안녕하세요!",
  "type": "TEXT"
}
```

### 이미지 메시지 전송
```http
POST /chats/:chatRoomId/messages/image
Content-Type: multipart/form-data
```

## 👫 친구 API

### 친구 목록
```http
GET /friends
```

### 친구 요청 보내기
```http
POST /friends/request
```

**Request Body:**
```json
{
  "toUserId": "user_456",
  "message": "친구가 되어주세요!"
}
```

### 받은 친구 요청
```http
GET /friends/requests/received
```

### 보낸 친구 요청
```http
GET /friends/requests/sent
```

### 친구 요청 수락/거절
```http
POST /friends/accept
POST /friends/reject
```

**Request Body:**
```json
{
  "requestId": "freq_123"
}
```

## 💎 프리미엄 & 결제 API

### 프리미엄 상품 목록
```http
GET /premium/products
```

### 구독 시작
```http
POST /premium/subscribe
```

**Request Body:**
```json
{
  "productId": "premium_monthly",
  "paymentMethodId": "pm_123"
}
```

### 크레딧 구매
```http
POST /credits/purchase
```

**Request Body:**
```json
{
  "packageId": "credit_50",
  "paymentMethod": "TOSS_PAY",
  "paymentData": { ... }
}
```

### 결제 내역
```http
GET /payments/history
```

## 📍 즉석 모임 API

### 즉석 모임 생성
```http
POST /instant-meetings
```

**Request Body:**
```json
{
  "title": "퇴근 후 맥주 한잔",
  "description": "가볍게 맥주 한잔 하실 분",
  "location": {
    "lat": 37.4979,
    "lng": 127.0276,
    "placeName": "강남역 3번출구"
  },
  "meetingTime": "2024-01-15T19:00:00Z",
  "maxParticipants": 4,
  "tags": ["맥주", "퇴근"]
}
```

### 주변 즉석 모임 조회
```http
GET /instant-meetings/nearby
```

**Query Parameters:**
- `lat`: 현재 위도
- `lng`: 현재 경도
- `radius`: 검색 반경 (미터)

### 즉석 모임 참가
```http
POST /instant-meetings/:meetingId/join
```

## 🔔 알림 API

### 알림 목록
```http
GET /notifications
```

### 알림 읽음 처리
```http
PUT /notifications/:notificationId/read
```

### 푸시 토큰 등록
```http
POST /notifications/register-token
```

**Request Body:**
```json
{
  "token": "FCM_TOKEN_HERE",
  "platform": "IOS"
}
```

## 📊 통계 API

### 프로필 통계
```http
GET /stats/profile
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profileViews": 156,
    "likesSent": 45,
    "likesReceived": 23,
    "matchRate": 0.34,
    "averageResponseTime": "2h 15m",
    "popularityScore": 78
  }
}
```

## 🚨 에러 코드

### 인증 관련
- `AUTH_INVALID_TOKEN`: 유효하지 않은 토큰
- `AUTH_TOKEN_EXPIRED`: 만료된 토큰
- `AUTH_INSUFFICIENT_PERMISSION`: 권한 부족

### 사용자 관련
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `USER_ALREADY_EXISTS`: 이미 존재하는 사용자
- `USER_PROFILE_INCOMPLETE`: 프로필 정보 미완성

### 좋아요 관련
- `LIKE_ALREADY_SENT`: 이미 좋아요를 보냄
- `LIKE_COOLDOWN_ACTIVE`: 쿨다운 기간 중
- `LIKE_INSUFFICIENT_CREDITS`: 크레딧 부족

### 그룹 관련
- `GROUP_NOT_FOUND`: 그룹을 찾을 수 없음
- `GROUP_ALREADY_MEMBER`: 이미 그룹 멤버
- `GROUP_FULL`: 그룹 정원 초과
- `GROUP_VERIFICATION_REQUIRED`: 인증 필요

### 결제 관련
- `PAYMENT_FAILED`: 결제 실패
- `PAYMENT_ALREADY_PROCESSED`: 이미 처리된 결제
- `PAYMENT_INVALID_METHOD`: 유효하지 않은 결제 수단

## 🔧 WebSocket Events

### 연결
```javascript
socket.connect({
  auth: {
    token: "JWT_TOKEN"
  }
});
```

### 이벤트 목록

**클라이언트 → 서버:**
- `join-room`: 채팅방 입장
- `leave-room`: 채팅방 퇴장
- `send-message`: 메시지 전송
- `typing-start`: 타이핑 시작
- `typing-stop`: 타이핑 중지
- `mark-read`: 읽음 표시

**서버 → 클라이언트:**
- `new-message`: 새 메시지 수신
- `message-sent`: 메시지 전송 확인
- `user-typing`: 상대방 타이핑 중
- `user-online`: 사용자 온라인
- `user-offline`: 사용자 오프라인
- `new-match`: 새로운 매칭
- `new-like`: 새로운 좋아요