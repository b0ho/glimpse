// 앱 상수
export const APP_CONFIG = {
  NAME: 'Glimpse',
  VERSION: '0.1.0',
  DESCRIPTION: 'Anonymous group-based dating app',
} as const;

// 좋아요 시스템 상수
export const LIKE_SYSTEM = {
  DAILY_FREE_LIKES: 1,
  COOLDOWN_PERIOD_DAYS: 14,
  MAX_LIKES_PER_DAY: 10,
} as const;

// 그룹 상수
export const GROUP_LIMITS = {
  MIN_MEMBERS_FOR_MATCHING: 4,
  MIN_MALE_MEMBERS: 2,
  MIN_FEMALE_MEMBERS: 2,
  MAX_GROUP_NAME_LENGTH: 50,
  MAX_GROUP_DESCRIPTION_LENGTH: 200,
} as const;

// 채팅 상수
export const CHAT_CONFIG = {
  MESSAGE_MAX_LENGTH: 500,
  TYPING_TIMEOUT: 3000,
  CONNECTION_TIMEOUT: 10000,
} as const;

// 알림 상수
export const NOTIFICATION_CONFIG = {
  CHANNELS: {
    MATCHES: 'matches',
    MESSAGES: 'messages', 
    LIKES: 'likes',
  },
  CHANNEL_NAMES: {
    MATCHES: '새로운 매치',
    MESSAGES: '메시지',
    LIKES: '좋아요',
  },
} as const;

// 보안 상수
export const SECURITY = {
  TOKEN_REFRESH_INTERVAL: 15 * 60 * 1000, // 15분
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24시간
  PASSWORD_MIN_LENGTH: 8,
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 5,
} as const;

// 애니메이션 상수
export const ANIMATION = {
  DURATION: {
    SHORT: 200,
    MEDIUM: 300,
    LONG: 500,
  },
  EASING: {
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
  },
} as const;

// 컬러 테마
export const COLORS = {
  PRIMARY: '#FF6B6B',
  SECONDARY: '#4ECDC4',
  SUCCESS: '#45B7D1',
  WARNING: '#FFA726',
  ERROR: '#EF5350',
  BACKGROUND: '#F8F9FA',
  SURFACE: '#FFFFFF',
  TEXT: {
    PRIMARY: '#212529',
    SECONDARY: '#6C757D',
    LIGHT: '#ADB5BD',
    WHITE: '#FFFFFF',
  },
  BORDER: '#E9ECEF',
  // 공통 UI 색상들
  BLACK: '#000000',
  TRANSPARENT: 'transparent',
  SHADOW: '#000',
  OVERLAY: 'rgba(0, 0, 0, 0.5)',
  OVERLAY_LIGHT: 'rgba(0, 0, 0, 0.3)',
  // 추가 색상들
  primary: '#FF6B6B',
  text: '#212529',
  textSecondary: '#6C757D',
  white: '#FFFFFF',
  gray50: '#F8F9FA',
  gray200: '#E9ECEF',
  gray300: '#DEE2E6',
  gray500: '#ADB5BD',
  premium: '#FFD700',
} as const;

// 스타일 상수
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
  // 소문자 별칭 추가
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZES = {
  XS: 12,
  SM: 14,
  MD: 16,
  LG: 18,
  XL: 20,
  XXL: 24,
  XXXL: 32,
} as const;

// 타이포그래피 스타일
export const TYPOGRAPHY = {
  h1: {
    fontSize: FONT_SIZES.XXXL,
    fontWeight: 'bold' as 'bold',
    lineHeight: 40,
  },
  h2: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold' as 'bold',
    lineHeight: 32,
  },
  h3: {
    fontSize: FONT_SIZES.XL,
    fontWeight: '600' as '600',
    lineHeight: 28,
  },
  h4: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600' as '600',
    lineHeight: 24,
  },
  body: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'normal' as 'normal',
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: FONT_SIZES.SM,
    fontWeight: 'normal' as 'normal',
    lineHeight: 20,
  },
  caption: {
    fontSize: FONT_SIZES.XS,
    fontWeight: 'normal' as 'normal',
    lineHeight: 16,
  },
} as const;

// 정규 표현식
export const REGEX = {
  PHONE: /^\+?[1-9]\d{1,14}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NICKNAME: /^[a-zA-Z0-9가-힣]{2,20}$/,
  COMPANY_EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// 에러 메시지
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  INVALID_PHONE: '올바른 전화번호를 입력해주세요.',
  INVALID_OTP: '인증번호가 올바르지 않습니다.',
  NICKNAME_EXISTS: '이미 사용중인 닉네임입니다.',
  INSUFFICIENT_LIKES: '일일 좋아요 한도에 도달했습니다.',
  ALREADY_LIKED: '이미 좋아요를 보낸 사용자입니다.',
  GROUP_FULL: '그룹이 가득 찼습니다.',
  LOCATION_DENIED: '위치 권한이 필요합니다.',
  CAMERA_DENIED: '카메라 권한이 필요합니다.',
  STORAGE_DENIED: '저장소 권한이 필요합니다.',
  GENERIC_ERROR: '오류가 발생했습니다. 다시 시도해주세요.',
} as const;