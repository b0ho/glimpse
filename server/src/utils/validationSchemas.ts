import { body, param, query, ValidationChain } from 'express-validator';

// Common validators
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

// Composite validators for specific endpoints
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

// SQL Injection prevention helpers
export function sanitizeInput(input: string): string {
  // Remove SQL keywords and special characters
  const sqlKeywords = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|WHERE|FROM|JOIN|OR|AND|EXEC|EXECUTE|SCRIPT|JAVASCRIPT|ALERT)\b)/gi;
  const specialChars = /[<>'"`;\\]/g;
  
  return input
    .replace(sqlKeywords, '')
    .replace(specialChars, '')
    .trim();
}

// XSS prevention helpers
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

// Custom validation for Korean phone numbers
export function isValidKoreanPhoneNumber(phone: string): boolean {
  const regex = /^010-\d{4}-\d{4}$/;
  return regex.test(phone);
}

// Custom validation for Korean business registration number
export function isValidBusinessNumber(number: string): boolean {
  const regex = /^\d{3}-\d{2}-\d{5}$/;
  return regex.test(number);
}