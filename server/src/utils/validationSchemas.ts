/**
 * 유효성 검사 스키마 모음
 * @module utils/validationSchemas
 * @description Express Validator를 사용한 애플리케이션 전체 유효성 검사 규칙
 */

import { body, param, query, ValidationChain } from 'express-validator';

/**
 * 공통 유효성 검사기
 * @constant validators
 * @description 애플리케이션 전체에서 재사용되는 기본 유효성 검사 규칙
 */
export const validators = {
  // ID validators
  id: param('id')
    .isUUID()
    .withMessage('유효하지 않은 ID 형식입니다'),
    
  userId: param('userId')
    .isUUID()
    .withMessage('유효하지 않은 사용자 ID 형식입니다'),
    
  groupId: param('groupId')
    .isUUID()
    .withMessage('유효하지 않은 그룹 ID 형식입니다'),

  // Phone number validator
  phoneNumber: body('phoneNumber')
    .matches(/^010-\d{4}-\d{4}$/)
    .withMessage('올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)'),

  // Auth validators
  password: body('password')
    .isLength({ min: 8, max: 100 })
    .withMessage('비밀번호는 8자 이상 100자 이하여야 합니다')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다'),

  nickname: body('nickname')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('닉네임은 2자 이상 20자 이하여야 합니다')
    .matches(/^[가-힣a-zA-Z0-9]+$/)
    .withMessage('닉네임은 한글, 영문, 숫자만 사용 가능합니다'),

  realName: body('realName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('이름은 2자 이상 50자 이하여야 합니다')
    .matches(/^[가-힣a-zA-Z\s]+$/)
    .withMessage('이름은 한글과 영문만 사용 가능합니다'),

  // Profile validators
  bio: body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('자기소개는 500자 이하여야 합니다'),

  interests: body('interests')
    .optional()
    .isArray({ max: 10 })
    .withMessage('관심사는 최대 10개까지 설정 가능합니다'),

  birthYear: body('birthYear')
    .isInt({ min: 1950, max: new Date().getFullYear() - 18 })
    .withMessage('올바른 출생년도를 입력해주세요'),

  gender: body('gender')
    .isIn(['MALE', 'FEMALE', 'OTHER'])
    .withMessage('올바른 성별을 선택해주세요'),

  // Group validators
  groupName: body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('그룹명은 2자 이상 50자 이하여야 합니다'),

  groupDescription: body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('그룹 설명은 1000자 이하여야 합니다'),

  groupType: body('type')
    .isIn(['OFFICIAL', 'CREATED', 'INSTANCE', 'LOCATION'])
    .withMessage('올바른 그룹 타입을 선택해주세요'),

  // Message validators
  messageContent: body('content')
    .trim()
    .notEmpty()
    .withMessage('메시지 내용을 입력해주세요')
    .isLength({ max: 1000 })
    .withMessage('메시지는 1000자 이하여야 합니다'),

  messageType: body('type')
    .isIn(['TEXT', 'IMAGE', 'VOICE', 'LOCATION', 'STORY_REPLY'])
    .withMessage('올바른 메시지 타입을 선택해주세요'),

  // Pagination validators
  page: query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('페이지 번호는 1 이상 1000 이하여야 합니다'),

  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('한 페이지당 항목 수는 1 이상 100 이하여야 합니다'),

  // Payment validators
  paymentMethod: body('paymentMethod')
    .isIn(['CARD', 'KAKAOPAY', 'TOSSPAY', 'NAVERPAY'])
    .withMessage('올바른 결제 수단을 선택해주세요'),

  amount: body('amount')
    .isInt({ min: 100, max: 10000000 })
    .withMessage('결제 금액은 100원 이상 1000만원 이하여야 합니다'),

  // Location validators
  latitude: body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('올바른 위도 값을 입력해주세요'),

  longitude: body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('올바른 경도 값을 입력해주세요'),

  // File upload validators
  fileSize: body('fileSize')
    .optional()
    .isInt({ max: 10485760 }) // 10MB
    .withMessage('파일 크기는 10MB 이하여야 합니다'),

  // Company verification validators
  companyEmail: body('companyEmail')
    .isEmail()
    .withMessage('올바른 이메일 형식이 아닙니다')
    .matches(/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .withMessage('회사 도메인 이메일을 입력해주세요'),

  // Story validators
  storyContent: body('content')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('스토리 텍스트는 200자 이하여야 합니다'),

  storyDuration: body('duration')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('스토리 재생 시간은 1초 이상 60초 이하여야 합니다')
};

/**
 * 인증 관련 유효성 검사기
 * @constant authValidators
 * @description 회원가입, 로그인, SMS 인증 등 인증 엔드포인트용 검사기
 */
export const authValidators = {
  register: [
    validators.phoneNumber,
    validators.nickname,
    validators.realName,
    validators.birthYear,
    validators.gender,
    validators.password
  ],
  
  login: [
    validators.phoneNumber,
    validators.password
  ],
  
  sendSMS: [
    validators.phoneNumber
  ],
  
  verifySMS: [
    validators.phoneNumber,
    body('code')
      .matches(/^\d{4,6}$/)
      .withMessage('올바른 인증 코드를 입력해주세요')
  ]
};

/**
 * 사용자 관련 유효성 검사기
 * @constant userValidators
 * @description 프로필 업데이트, 이미지 업로드 등 사용자 엔드포인트용 검사기
 */
export const userValidators = {
  updateProfile: [
    validators.nickname.optional(),
    validators.bio,
    validators.interests,
    body('profileImage')
      .optional()
      .isURL()
      .withMessage('올바른 이미지 URL을 입력해주세요')
  ],
  
  uploadProfileImage: [
    validators.fileSize
  ]
};

/**
 * 그룹 관련 유효성 검사기
 * @constant groupValidators
 * @description 그룹 생성, 수정, 참여 등 그룹 엔드포인트용 검사기
 */
export const groupValidators = {
  create: [
    validators.groupName,
    validators.groupDescription,
    validators.groupType,
    body('isPrivate')
      .optional()
      .isBoolean()
      .withMessage('공개/비공개 설정은 true/false 값이어야 합니다'),
    body('requiresApproval')
      .optional()
      .isBoolean()
      .withMessage('승인 필요 설정은 true/false 값이어야 합니다')
  ],
  
  update: [
    validators.groupName.optional(),
    validators.groupDescription,
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('활성화 설정은 true/false 값이어야 합니다')
  ],
  
  join: [
    validators.groupId
  ]
};

/**
 * 메시지 관련 유효성 검사기
 * @constant messageValidators
 * @description 메시지 전송, 읽음 표시 등 메시지 엔드포인트용 검사기
 */
export const messageValidators = {
  send: [
    validators.messageContent,
    validators.messageType,
    body('matchId')
      .isUUID()
      .withMessage('유효하지 않은 매치 ID입니다')
  ],
  
  markAsRead: [
    param('messageId')
      .isUUID()
      .withMessage('유효하지 않은 메시지 ID입니다')
  ]
};

/**
 * 좋아요 관련 유효성 검사기
 * @constant likeValidators
 * @description 좋아요 전송 등 좋아요 기능 엔드포인트용 검사기
 */
export const likeValidators = {
  sendLike: [
    body('targetUserId')
      .isUUID()
      .withMessage('유효하지 않은 대상 사용자 ID입니다'),
    body('groupId')
      .isUUID()
      .withMessage('유효하지 않은 그룹 ID입니다')
  ]
};

/**
 * 결제 관련 유효성 검사기
 * @constant paymentValidators
 * @description 결제 생성, 웹훅 처리 등 결제 엔드포인트용 검사기
 */
export const paymentValidators = {
  createPayment: [
    validators.paymentMethod,
    validators.amount,
    body('itemType')
      .isIn(['CREDIT', 'PREMIUM'])
      .withMessage('올바른 상품 타입을 선택해주세요')
  ],
  
  webhook: [
    body('paymentId')
      .notEmpty()
      .withMessage('결제 ID가 필요합니다'),
    body('status')
      .isIn(['SUCCESS', 'FAILED', 'CANCELLED'])
      .withMessage('올바른 결제 상태를 입력해주세요')
  ]
};

/**
 * 위치 관련 유효성 검사기
 * @constant locationValidators
 * @description 위치 업데이트, 근처 사용자 검색 등 위치 엔드포인트용 검사기
 */
export const locationValidators = {
  updateLocation: [
    validators.latitude,
    validators.longitude
  ],
  
  getNearbyUsers: [
    query('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('올바른 위도 값을 입력해주세요'),
    query('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('올바른 경도 값을 입력해주세요'),
    query('radius')
      .optional()
      .isInt({ min: 100, max: 50000 })
      .withMessage('검색 반경은 100m 이상 50km 이하여야 합니다')
  ]
};

/**
 * 스토리 관련 유효성 검사기
 * @constant storyValidators
 * @description 스토리 생성, 반응 등 스토리 기능 엔드포인트용 검사기
 */
export const storyValidators = {
  create: [
    validators.storyContent,
    validators.storyDuration,
    body('mediaUrl')
      .optional()
      .isURL()
      .withMessage('올바른 미디어 URL을 입력해주세요'),
    body('mediaType')
      .optional()
      .isIn(['IMAGE', 'VIDEO'])
      .withMessage('올바른 미디어 타입을 선택해주세요')
  ],
  
  reaction: [
    param('storyId')
      .isUUID()
      .withMessage('유효하지 않은 스토리 ID입니다'),
    body('type')
      .isIn(['LIKE', 'LOVE', 'WOW', 'SAD', 'ANGRY'])
      .withMessage('올바른 반응 타입을 선택해주세요')
  ]
};

/**
 * SQL 인젝션 방지를 위한 입력값 정화
 * @function sanitizeInput
 * @param {string} input - 정화할 입력값
 * @returns {string} 정화된 문자열
 * @description SQL 키워드와 특수문자를 제거하여 SQL 인젝션 공격 방지
 */
export function sanitizeInput(input: string): string {
  // Remove SQL keywords and special characters
  const sqlKeywords = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|WHERE|FROM|JOIN|OR|AND|EXEC|EXECUTE|SCRIPT|JAVASCRIPT|ALERT)\b)/gi;
  const specialChars = /[<>'"`;\\]/g;
  
  return input
    .replace(sqlKeywords, '')
    .replace(specialChars, '')
    .trim();
}

/**
 * XSS 방지를 위한 HTML 이스케이프
 * @function escapeHtml
 * @param {string} text - 이스케이프할 텍스트
 * @returns {string} HTML 엔티티로 변환된 문자열
 * @description HTML 특수문자를 엔티티로 변환하여 XSS 공격 방지
 */
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * 한국 휴대폰 번호 유효성 검사
 * @function isValidKoreanPhoneNumber
 * @param {string} phone - 검사할 휴대폰 번호
 * @returns {boolean} 유효성 여부
 * @description 010-XXXX-XXXX 형식의 한국 휴대폰 번호 검증
 */
export function isValidKoreanPhoneNumber(phone: string): boolean {
  const regex = /^010-\d{4}-\d{4}$/;
  return regex.test(phone);
}

/**
 * 한국 사업자등록번호 유효성 검사
 * @function isValidBusinessNumber
 * @param {string} number - 검사할 사업자등록번호
 * @returns {boolean} 유효성 여부
 * @description XXX-XX-XXXXX 형식의 한국 사업자등록번호 검증
 */
export function isValidBusinessNumber(number: string): boolean {
  const regex = /^\d{3}-\d{2}-\d{5}$/;
  return regex.test(number);
}