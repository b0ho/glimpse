/**
 * 입력 유효성 검사 유틸리티
 * @module utils/inputValidation
 * @description 사용자 입력 데이터 유효성 검사 함수
 */

import { createError } from '../middleware/errorHandler';

/**
 * 한국 휴대폰 번호 형식 검증
 * @function validatePhoneNumber
 * @param {string} phoneNumber - 검증할 휴대폰 번호
 * @returns {boolean} 유효성 여부
 * @description +82 또는 0으로 시작하는 한국 휴대폰 번호 형식 검증
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  const koreanPhoneRegex = /^(\+82|0)(10|11|16|17|18|19)\d{7,8}$/;
  const cleanedNumber = phoneNumber.replace(/[-\s]/g, '');
  return koreanPhoneRegex.test(cleanedNumber);
}

/**
 * 이메일 형식 검증
 * @function validateEmail
 * @param {string} email - 검증할 이메일 주소
 * @returns {boolean} 유효성 여부
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 닉네임 유효성 검증
 * @function validateNickname
 * @param {string} nickname - 검증할 닉네임
 * @returns {{isValid: boolean, error?: string}} 유효성 결과와 에러 메시지
 * @description 2-20자, 특수문자 제한, 공백만 불가
 */
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

/**
 * 나이 유효성 검증
 * @function validateAge
 * @param {number} age - 검증할 나이
 * @returns {boolean} 유효성 여부
 * @description 18세 이상 100세 이하만 허용
 */
export function validateAge(age: number): boolean {
  return age >= 18 && age <= 100;
}

/**
 * 그룹명 유효성 검증
 * @function validateGroupName
 * @param {string} name - 검증할 그룹명
 * @returns {{isValid: boolean, error?: string}} 유효성 결과와 에러 메시지
 * @description 2-50자, 특수문자 제한
 */
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

/**
 * 메시지 내용 유효성 검증
 * @function validateMessageContent
 * @param {string} content - 검증할 메시지 내용
 * @returns {{isValid: boolean, error?: string}} 유효성 결과와 에러 메시지
 * @description 최대 1000자, 빈 메시지 불가
 */
export function validateMessageContent(content: string): { isValid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: '메시지 내용을 입력해주세요.' };
  }

  if (content.length > 1000) {
    return { isValid: false, error: '메시지는 1000자를 초과할 수 없습니다.' };
  }

  return { isValid: true };
}

/**
 * 파일 업로드 유효성 검증
 * @function validateFileUpload
 * @param {Express.Multer.File} file - 검증할 파일
 * @returns {{isValid: boolean, error?: string}} 유효성 결과와 에러 메시지
 * @description 최대 10MB, 이미지 파일만 허용 (JPEG, PNG, GIF, WebP)
 */
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

/**
 * 페이지네이션 파라미터 유효성 검증
 * @function validatePagination
 * @param {any} page - 페이지 번호
 * @param {any} limit - 페이지당 항목 수
 * @returns {{page: number, limit: number}} 유효한 페이지네이션 값
 * @description 기본값 page=1, limit=20, 최대 limit=100
 */
export function validatePagination(page: any, limit: any): { page: number; limit: number } {
  const parsedPage = parseInt(page) || 1;
  const parsedLimit = parseInt(limit) || 20;

  // Ensure positive values
  const validPage = Math.max(1, parsedPage);
  const validLimit = Math.min(100, Math.max(1, parsedLimit)); // Max 100 items per page

  return { page: validPage, limit: validLimit };
}

/**
 * UUID 형식 유효성 검증
 * @function validateUUID
 * @param {string} uuid - 검증할 UUID
 * @returns {boolean} 유효성 여부
 * @description 표준 UUID 형식과 CUID 형식 모두 지원
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // Also support cuid format
  const cuidRegex = /^c[a-z0-9]{24}$/;
  return uuidRegex.test(uuid) || cuidRegex.test(uuid);
}

/**
 * 좌표 유효성 검증
 * @function validateCoordinate
 * @param {any} lat - 위도
 * @param {any} lng - 경도
 * @returns {boolean} 유효성 여부
 * @description 위치 기반 기능을 위한 위도(-90~90), 경도(-180~180) 검증
 */
export function validateCoordinate(lat: any, lng: any): boolean {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return false;
  }

  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

/**
 * 검색 쿼리 유효성 검증 및 정화
 * @function validateSearchQuery
 * @param {string} query - 검색 쿼리
 * @returns {string} 정화된 검색 쿼리
 * @description 특수문자 제거, 최대 100자 제한
 */
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

/**
 * 결제 금액 유효성 검증
 * @function validatePaymentAmount
 * @param {number} amount - 검증할 금액
 * @param {number} [min=100] - 최소 금액
 * @param {number} [max=10000000] - 최대 금액
 * @returns {boolean} 유효성 여부
 * @description 정수 금액만 허용
 */
export function validatePaymentAmount(amount: number, min: number = 100, max: number = 10000000): boolean {
  return !isNaN(amount) && amount >= min && amount <= max && Number.isInteger(amount);
}

/**
 * 날짜 범위 유효성 검증
 * @function validateDateRange
 * @param {any} startDate - 시작 날짜
 * @param {any} endDate - 종료 날짜
 * @returns {boolean} 유효성 여부
 * @description 시작 날짜가 종료 날짜보다 이전인지 검증
 */
export function validateDateRange(startDate: any, endDate: any): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false;
  }

  return start <= end;
}

/**
 * 유효성 검사 미들웨어 생성
 * @function createValidator
 * @param {Record<string, Function>} validationRules - 필드별 유효성 검사 규칙
 * @returns {Function} Express 미들웨어 함수
 * @description 주어진 규칙에 따라 요청 데이터를 검증하는 미들웨어 생성
 */
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
      const error = createError(400, 'Validation failed');
      (error as any).errors = errors;
      return next(error);
    }

    next();
  };
}