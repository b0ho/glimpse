// App Configuration
export const APP_CONFIG = {
  NAME: 'Glimpse',
  VERSION: '1.0.0',
  MIN_AGE: 18,
  MAX_AGE: 99,
  DEFAULT_LIKE_CREDITS: 5,
  MAX_DAILY_LIKES: 50,
  PREMIUM_UNLIMITED_LIKES: true,
  MATCH_EXPIRY_DAYS: 30,
  MESSAGE_MAX_LENGTH: 1000,
  BIO_MAX_LENGTH: 500,
  NICKNAME_MIN_LENGTH: 2,
  NICKNAME_MAX_LENGTH: 10
} as const;

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1',
  SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL || 'ws://localhost:8080',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
} as const;

// Pricing (Korean Won)
export const PRICING = {
  PREMIUM_MONTHLY: 9900,
  PREMIUM_YEARLY: 99000,
  LIKE_PACKAGES: [
    { credits: 5, price: 2500 },
    { credits: 10, price: 4500 },
    { credits: 20, price: 8500 },
    { credits: 50, price: 19000 }
  ]
} as const;

// Group Configuration
export const GROUP_CONFIG = {
  MAX_MEMBERS: {
    OFFICIAL: 1000,
    CREATED: 100,
    INSTANCE: 50,
    LOCATION: 20
  },
  DEFAULT_RADIUS_METERS: 100,
  MAX_RADIUS_METERS: 1000,
  MIN_MEMBERS_FOR_MATCHING: 4 // 2 males, 2 females minimum
} as const;

// Location Configuration
export const LOCATION_CONFIG = {
  DEFAULT_ACCURACY_METERS: 100,
  MAX_ACCURACY_METERS: 500,
  QR_CODE_EXPIRY_MINUTES: 5,
  CHECK_IN_EXPIRY_HOURS: 24
} as const;

// Verification Configuration
export const VERIFICATION_CONFIG = {
  EMAIL_VERIFICATION_EXPIRY_HOURS: 24,
  OCR_MAX_FILE_SIZE_MB: 5,
  INVITE_CODE_LENGTH: 8,
  INVITE_CODE_EXPIRY_DAYS: 7,
  HR_APPROVAL_EXPIRY_DAYS: 30
} as const;

// Chat Configuration
export const CHAT_CONFIG = {
  MESSAGE_PAGINATION_LIMIT: 50,
  TYPING_TIMEOUT_MS: 3000,
  MAX_MESSAGE_LENGTH: 1000,
  SUPPORTED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  MAX_FILE_SIZE_MB: 10
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  LIKE_RECEIVED: {
    title: '새로운 좋아요',
    body: '누군가 당신을 좋아합니다!'
  },
  MATCH_CREATED: {
    title: '새로운 매치!',
    body: '축하합니다! 새로운 매치가 생겼습니다.'
  },
  MESSAGE_RECEIVED: {
    title: '새 메시지',
    body: '새로운 메시지가 도착했습니다.'
  },
  GROUP_INVITATION: {
    title: '그룹 초대',
    body: '새로운 그룹에 초대되었습니다.'
  },
  VERIFICATION_APPROVED: {
    title: '인증 완료',
    body: '회사 인증이 승인되었습니다!'
  },
  VERIFICATION_REJECTED: {
    title: '인증 실패',
    body: '회사 인증이 거절되었습니다.'
  },
  PAYMENT_SUCCESS: {
    title: '결제 완료',
    body: '결제가 성공적으로 완료되었습니다!'
  },
  SUBSCRIPTION_CANCELLED: {
    title: '구독 취소 완료',
    body: '프리미엄 구독이 취소되었습니다.'
  }
} as const;

// Error Messages (Korean)
export const ERROR_MESSAGES = {
  // Authentication
  INVALID_PHONE: '올바른 전화번호 형식이 아닙니다.',
  INVALID_VERIFICATION_CODE: '인증 코드가 올바르지 않습니다.',
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
  UNAUTHORIZED: '인증이 필요합니다.',
  ACCESS_DENIED: '접근 권한이 없습니다.',
  
  // Likes & Matching
  INSUFFICIENT_CREDITS: '좋아요 크레딧이 부족합니다.',
  ALREADY_LIKED: '이미 좋아요를 누른 사용자입니다.',
  LIKE_COOLDOWN: '같은 사용자에게는 2주 후에 다시 좋아요할 수 있습니다.',
  SELF_LIKE_NOT_ALLOWED: '자신에게는 좋아요할 수 없습니다.',
  
  // Groups
  GROUP_NOT_FOUND: '그룹을 찾을 수 없습니다.',
  GROUP_FULL: '그룹이 가득 찼습니다.',
  ALREADY_MEMBER: '이미 그룹의 멤버입니다.',
  GROUP_APPROVAL_REQUIRED: '그룹 가입 승인이 필요합니다.',
  
  // Verification
  VERIFICATION_PENDING: '인증이 진행 중입니다.',
  VERIFICATION_FAILED: '인증에 실패했습니다.',
  INVALID_COMPANY_EMAIL: '회사 이메일이 올바르지 않습니다.',
  INVITE_CODE_EXPIRED: '초대 코드가 만료되었습니다.',
  
  // Payment
  PAYMENT_FAILED: '결제에 실패했습니다.',
  INVALID_PAYMENT_METHOD: '올바르지 않은 결제 방법입니다.',
  ALREADY_PREMIUM: '이미 프리미엄 멤버입니다.',
  
  // General
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
  VALIDATION_ERROR: '입력 정보를 확인해주세요.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  FILE_TOO_LARGE: '파일 크기가 너무 큽니다.',
  UNSUPPORTED_FILE_TYPE: '지원하지 않는 파일 형식입니다.'
} as const;

// Success Messages (Korean)
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: '프로필이 업데이트되었습니다.',
  LIKE_SENT: '좋아요를 보냈습니다!',
  MATCH_CREATED: '새로운 매치가 생성되었습니다!',
  GROUP_JOINED: '그룹에 가입되었습니다.',
  GROUP_CREATED: '그룹이 생성되었습니다.',
  MESSAGE_SENT: '메시지가 전송되었습니다.',
  VERIFICATION_SUBMITTED: '인증 요청이 제출되었습니다.',
  PAYMENT_SUCCESS: '결제가 완료되었습니다.',
  PREMIUM_ACTIVATED: '프리미엄 멤버십이 활성화되었습니다!'
} as const;

// Regular Expressions
export const REGEX = {
  PHONE_KOREAN: /^01[0-9]-\d{3,4}-\d{4}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NICKNAME: /^[가-힣a-zA-Z0-9]{2,10}$/,
  PASSWORD: /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  KOREAN_COMPANY_DOMAINS: [
    'samsung.com',
    'lg.com', 
    'sk.com',
    'hyundai.com',
    'lotte.com',
    'cj.net',
    'naver.com',
    'kakao.com',
    'line.me',
    'baemin.com'
  ]
} as const;

// Socket Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Rooms
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  
  // Chat
  MESSAGE: 'message',
  TYPING_START: 'typing-start',
  TYPING_STOP: 'typing-stop',
  MESSAGE_READ: 'message-read',
  
  // Matches
  NEW_MATCH: 'new-match',
  MATCH_EXPIRED: 'match-expired',
  
  // User status
  USER_ONLINE: 'user-online',
  USER_OFFLINE: 'user-offline'
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  DEVICE_TOKEN: 'device_token',
  SETTINGS: 'app_settings',
  LOCATION_PERMISSION: 'location_permission',
  NOTIFICATION_PERMISSION: 'notification_permission',
  USER_LANGUAGE: 'user_language'
} as const;

// Export i18n constants
export * from './i18n';