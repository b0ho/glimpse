import { createError } from '../middleware/errorHandler';

/**
 * Enhanced input validation utilities
 */

// Validate phone number format (Korean)
export function validatePhoneNumber(phoneNumber: string): boolean {
  const koreanPhoneRegex = /^(\+82|0)(10|11|16|17|18|19)\d{7,8}$/;
  const cleanedNumber = phoneNumber.replace(/[-\s]/g, '');
  return koreanPhoneRegex.test(cleanedNumber);
}

// Validate email format
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate nickname
export function validateNickname(nickname: string): { isValid: boolean; error?: string } {
  if (!nickname || nickname.trim().length === 0) {
    return { isValid: false, error: '닉네임을 입력해주세요.' };
  }

  if (nickname.length < 2 || nickname.length > 20) {
    return { isValid: false, error: '닉네임은 2-20자 사이여야 합니다.' };
  }

  // Check for inappropriate characters
  const invalidCharsRegex = /[<>'"\/\\]/;
  if (invalidCharsRegex.test(nickname)) {
    return { isValid: false, error: '사용할 수 없는 문자가 포함되어 있습니다.' };
  }

  // Check for only whitespace
  if (nickname.trim().length === 0) {
    return { isValid: false, error: '공백만으로는 닉네임을 만들 수 없습니다.' };
  }

  return { isValid: true };
}

// Validate age
export function validateAge(age: number): boolean {
  return age >= 18 && age <= 100;
}

// Validate group name
export function validateGroupName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: '그룹 이름을 입력해주세요.' };
  }

  if (name.length < 2 || name.length > 50) {
    return { isValid: false, error: '그룹 이름은 2-50자 사이여야 합니다.' };
  }

  // Check for inappropriate characters
  const invalidCharsRegex = /[<>'"\/\\]/;
  if (invalidCharsRegex.test(name)) {
    return { isValid: false, error: '사용할 수 없는 문자가 포함되어 있습니다.' };
  }

  return { isValid: true };
}

// Validate message content
export function validateMessageContent(content: string): { isValid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: '메시지 내용을 입력해주세요.' };
  }

  if (content.length > 1000) {
    return { isValid: false, error: '메시지는 1000자를 초과할 수 없습니다.' };
  }

  return { isValid: true };
}

// Validate file upload
export function validateFileUpload(file: Express.Multer.File): { isValid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (!file) {
    return { isValid: false, error: '파일이 없습니다.' };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: '파일 크기는 10MB를 초과할 수 없습니다.' };
  }

  if (!allowedTypes.includes(file.mimetype)) {
    return { isValid: false, error: '지원하지 않는 파일 형식입니다.' };
  }

  return { isValid: true };
}

// Validate pagination parameters
export function validatePagination(page: any, limit: any): { page: number; limit: number } {
  const parsedPage = parseInt(page) || 1;
  const parsedLimit = parseInt(limit) || 20;

  // Ensure positive values
  const validPage = Math.max(1, parsedPage);
  const validLimit = Math.min(100, Math.max(1, parsedLimit)); // Max 100 items per page

  return { page: validPage, limit: validLimit };
}

// Validate UUID format
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // Also support cuid format
  const cuidRegex = /^c[a-z0-9]{24}$/;
  return uuidRegex.test(uuid) || cuidRegex.test(uuid);
}

// Validate coordinate (for location-based features)
export function validateCoordinate(lat: any, lng: any): boolean {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return false;
  }

  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

// Sanitize and validate search query
export function validateSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return '';
  }

  // Remove special characters that could be used for injection
  let sanitized = query.replace(/[<>'"\/\\]/g, '');
  
  // Trim and limit length
  sanitized = sanitized.trim().substring(0, 100);

  return sanitized;
}

// Validate payment amount
export function validatePaymentAmount(amount: number, min: number = 100, max: number = 10000000): boolean {
  return !isNaN(amount) && amount >= min && amount <= max && Number.isInteger(amount);
}

// Validate date range
export function validateDateRange(startDate: any, endDate: any): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false;
  }

  return start <= end;
}

// Create validation middleware
export function createValidator(validationRules: Record<string, (value: any) => boolean | { isValid: boolean; error?: string }>) {
  return (req: any, res: any, next: any) => {
    const errors: Record<string, string> = {};

    for (const [field, validator] of Object.entries(validationRules)) {
      const value = req.body[field] || req.query[field] || req.params[field];
      const result = validator(value);

      if (typeof result === 'boolean' && !result) {
        errors[field] = `Invalid ${field}`;
      } else if (typeof result === 'object' && !result.isValid) {
        errors[field] = result.error || `Invalid ${field}`;
      }
    }

    if (Object.keys(errors).length > 0) {
      return next(createError(400, 'Validation failed', { errors }));
    }

    next();
  };
}