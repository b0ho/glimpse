import { Transform } from 'class-transformer';
import * as DOMPurify from 'isomorphic-dompurify';

/**
 * 문자열 입력을 정제하는 데코레이터
 *
 * DTO 필드에 적용하여 XSS 및 SQL Injection을 방지합니다.
 */
export function Sanitize() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    // HTML 태그 제거
    let sanitized = DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });

    // 추가 정제
    sanitized = sanitized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();

    return sanitized;
  });
}

/**
 * 이메일 주소를 검증하고 정제하는 데코레이터
 */
export function SanitizeEmail() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return value;
    }

    // 소문자로 변환하고 공백 제거
    return value.toLowerCase().trim();
  });
}

/**
 * 전화번호를 정제하는 데코레이터
 */
export function SanitizePhone() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    // 숫자와 하이픈만 남기기
    return value.replace(/[^\d-]/g, '');
  });
}

/**
 * URL을 검증하고 정제하는 데코레이터
 */
export function SanitizeUrl() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    try {
      const url = new URL(value);
      // HTTP(S) 프로토콜만 허용
      if (!['http:', 'https:'].includes(url.protocol)) {
        return '';
      }
      return url.toString();
    } catch {
      return '';
    }
  });
}
