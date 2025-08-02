/**
 * 보안 유틸리티
 * @module utils/securityUtils
 * @description 데이터 마스킹, 살균, 보안 검사 함수
 */

/**
 * 민감한 데이터 마스킹
 * @function maskSensitiveData
 * @param {any} data - 마스킹할 데이터
 * @returns {any} 마스킹된 데이터
 * @description 로깅 시 민감한 정보를 ****로 처리
 */
export function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveFields = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'secret',
    'phoneNumber',
    'email',
    'creditCard',
    'cardNumber',
    'cvv',
    'ssn',
    'bankAccount',
    'stripePaymentId',
    'stripeCustomerId',
    'stripeSubscriptionId'
  ];

  const masked = { ...data };

  for (const key in masked) {
    if (masked.hasOwnProperty(key)) {
      const lowerKey = key.toLowerCase();
      
      // Check if the field name contains sensitive keywords
      if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
        if (typeof masked[key] === 'string' && masked[key]) {
          // Keep first and last 2 characters for partial identification
          if (masked[key].length > 4) {
            masked[key] = `${masked[key].slice(0, 2)}****${masked[key].slice(-2)}`;
          } else {
            masked[key] = '****';
          }
        }
      } else if (typeof masked[key] === 'object') {
        // Recursively mask nested objects
        masked[key] = maskSensitiveData(masked[key]);
      }
    }
  }

  return masked;
}

/**
 * XSS 방지를 위한 입력 살균
 * @function sanitizeInput
 * @param {string} input - 살균할 입력값
 * @returns {string} 살균된 문자열
 * @description HTML 엔티티 인코딩으로 XSS 공격 방지
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return input;
  }

  // Basic HTML entity encoding
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * 파일명 유효성 검사 및 살균
 * @function sanitizeFileName
 * @param {string} fileName - 검사할 파일명
 * @returns {string} 살균된 파일명
 * @description 경로 탐색 공격 방지, 특수문자 제거, 길이 제한
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return 'unknown';
  }

  // Remove path traversal attempts
  fileName = fileName.replace(/\.\./g, '');
  
  // Remove special characters except for dots and hyphens
  fileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length
  if (fileName.length > 255) {
    const ext = fileName.split('.').pop();
    const base = fileName.substring(0, 240);
    fileName = ext ? `${base}.${ext}` : base;
  }

  return fileName;
}

/**
 * 안전한 리다이렉트 URL 검사
 * @function isSafeRedirectUrl
 * @param {string} url - 검사할 URL
 * @param {string[]} [allowedDomains=[]] - 허용된 도메인 목록
 * @returns {boolean} 안전한 URL 여부
 * @description XSS, 오픈 리다이렉트 공격 방지
 */
export function isSafeRedirectUrl(url: string, allowedDomains: string[] = []): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    
    // Check for javascript: or data: protocols
    if (['javascript:', 'data:', 'vbscript:'].includes(parsedUrl.protocol)) {
      return false;
    }

    // If allowed domains are specified, check against them
    if (allowedDomains.length > 0) {
      return allowedDomains.some(domain => 
        parsedUrl.hostname === domain || 
        parsedUrl.hostname.endsWith(`.${domain}`)
      );
    }

    // Only allow http and https protocols
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    // Invalid URL
    return false;
  }
}

/**
 * 안전한 랜덤 토큰 생성
 * @function generateSecureToken
 * @param {number} [length=32] - 토큰 길이
 * @returns {string} 생성된 토큰
 * @description 암호학적으로 안전한 랜덤 토큰 생성
 */
export function generateSecureToken(length: number = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  const crypto = require('crypto');
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    token += charset[randomBytes[i] % charset.length];
  }
  
  return token;
}