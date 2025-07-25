import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { validationSchemas, sqlInjectionPatterns, sanitizeInput } from '../config/security';

// Validation middleware wrapper
export const validate = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }
    next();
  };
};

// Common validators
export const validators = {
  // User validators
  phoneNumber: body('phoneNumber')
    .trim()
    .matches(validationSchemas.phoneNumber)
    .withMessage('유효하지 않은 전화번호 형식입니다'),
    
  nickname: body('nickname')
    .trim()
    .matches(validationSchemas.nickname)
    .withMessage('닉네임은 2-20자의 한글, 영문, 숫자만 가능합니다')
    .custom((value) => !containsSQLInjection(value))
    .withMessage('유효하지 않은 문자가 포함되어 있습니다'),
    
  email: body('email')
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('유효하지 않은 이메일 형식입니다'),
    
  age: body('age')
    .optional()
    .isInt({ min: 18, max: 100 })
    .withMessage('나이는 18-100 사이여야 합니다'),
    
  gender: body('gender')
    .optional()
    .isIn(['MALE', 'FEMALE', 'OTHER'])
    .withMessage('유효하지 않은 성별입니다'),
    
  bio: body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('자기소개는 500자를 초과할 수 없습니다')
    .customSanitizer(sanitizeInput),
    
  // ID validators
  userId: param('userId')
    .isUUID()
    .withMessage('유효하지 않은 사용자 ID입니다'),
    
  groupId: param('groupId')
    .isUUID()
    .withMessage('유효하지 않은 그룹 ID입니다'),
    
  matchId: param('matchId')
    .isUUID()
    .withMessage('유효하지 않은 매치 ID입니다'),
    
  // Pagination validators
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('페이지 번호는 1 이상이어야 합니다'),
    
  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('한 페이지당 항목 수는 1-100 사이여야 합니다'),
    
  // Group validators
  groupName: body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('그룹 이름은 2-50자여야 합니다')
    .custom((value) => !containsSQLInjection(value))
    .withMessage('유효하지 않은 문자가 포함되어 있습니다'),
    
  groupDescription: body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('그룹 설명은 500자를 초과할 수 없습니다')
    .customSanitizer(sanitizeInput),
    
  groupType: body('type')
    .isIn(['OFFICIAL', 'CREATED', 'INSTANCE', 'LOCATION'])
    .withMessage('유효하지 않은 그룹 타입입니다'),
    
  // Message validators
  messageContent: body('content')
    .trim()
    .notEmpty()
    .withMessage('메시지 내용은 비어있을 수 없습니다')
    .isLength({ max: 1000 })
    .withMessage('메시지는 1000자를 초과할 수 없습니다')
    .customSanitizer(sanitizeInput),
    
  messageType: body('type')
    .optional()
    .isIn(['TEXT', 'IMAGE', 'SYSTEM'])
    .withMessage('유효하지 않은 메시지 타입입니다'),
    
  // Payment validators
  amount: body('amount')
    .isInt({ min: 100 })
    .withMessage('결제 금액은 100원 이상이어야 합니다'),
    
  paymentMethod: body('method')
    .isIn(['CARD', 'KAKAO_PAY', 'TOSS_PAY', 'NAVER_PAY'])
    .withMessage('유효하지 않은 결제 수단입니다'),
    
  // Location validators
  latitude: body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('유효하지 않은 위도입니다'),
    
  longitude: body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('유효하지 않은 경도입니다'),
    
  // File upload validators
  fileType: body('type')
    .optional()
    .isIn(['PROFILE_IMAGE', 'VERIFICATION_DOCUMENT', 'CHAT_IMAGE'])
    .withMessage('유효하지 않은 파일 타입입니다'),
};

// Check for SQL injection patterns
function containsSQLInjection(value: string): boolean {
  return sqlInjectionPatterns.some(pattern => pattern.test(value));
}

// Sanitize object recursively
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Skip dangerous keys
        if (['__proto__', 'constructor', 'prototype'].includes(key)) {
          continue;
        }
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}

// Validate file upload
export function validateFileUpload(file: Express.Multer.File) {
  const { fileUploadConfig } = require('../config/security');
  
  // Check file size
  if (file.size > fileUploadConfig.maxFileSize) {
    throw new Error('파일 크기가 너무 큽니다 (최대 10MB)');
  }
  
  // Check MIME type
  if (!fileUploadConfig.allowedMimeTypes.includes(file.mimetype)) {
    throw new Error('허용되지 않은 파일 형식입니다');
  }
  
  // Check file extension
  const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
  if (!fileUploadConfig.allowedExtensions.includes(ext)) {
    throw new Error('허용되지 않은 파일 확장자입니다');
  }
  
  // Check for double extensions
  if ((file.originalname.match(/\./g) || []).length > 1) {
    throw new Error('파일 이름에 여러 개의 확장자가 포함되어 있습니다');
  }
  
  return true;
}

// Validate Korean phone number with carrier check
export function validateKoreanPhoneNumber(phoneNumber: string): boolean {
  // Remove hyphens and spaces
  const cleaned = phoneNumber.replace(/[-\s]/g, '');
  
  // Check format
  if (!validationSchemas.phoneNumber.test(cleaned)) {
    return false;
  }
  
  // Check carrier prefix (010, 011, 016, 017, 018, 019)
  const carrierPrefixes = ['010', '011', '016', '017', '018', '019'];
  const prefix = cleaned.substring(0, 3);
  
  return carrierPrefixes.includes(prefix);
}

// Validate password strength
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const { passwordPolicy } = require('../config/security');
  
  if (password.length < passwordPolicy.minLength) {
    errors.push(`비밀번호는 최소 ${passwordPolicy.minLength}자 이상이어야 합니다`);
  }
  
  if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('대문자를 포함해야 합니다');
  }
  
  if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('소문자를 포함해야 합니다');
  }
  
  if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
    errors.push('숫자를 포함해야 합니다');
  }
  
  if (passwordPolicy.requireSpecialChars && !/[@$!%*#?&]/.test(password)) {
    errors.push('특수문자(@$!%*#?&)를 포함해야 합니다');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}