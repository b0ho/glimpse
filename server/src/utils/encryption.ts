/**
 * 암호화 유틸리티
 * AES-256-GCM을 사용한 개인정보 암호화/복호화
 */

import * as crypto from 'crypto';

// 환경변수에서 암호화 키 가져오기 (32바이트)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * 데이터 암호화
 */
export function encryptData(data: any): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  try {
    // JSON으로 직렬화
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    
    // 초기화 벡터 생성
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // 암호화 키 준비
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    
    // 암호화
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // 인증 태그 가져오기
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * 데이터 복호화
 */
export function decryptData(
  encrypted: string,
  iv: string,
  tag: string
): any {
  try {
    // 키와 IV, 태그 준비
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    const tagBuffer = Buffer.from(tag, 'hex');
    
    // 복호화
    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
    decipher.setAuthTag(tagBuffer);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // JSON 파싱 시도
    try {
      return JSON.parse(decrypted);
    } catch {
      // JSON이 아닌 경우 문자열 그대로 반환
      return decrypted;
    }
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * SHA-256 해시 생성 (매칭용)
 */
export function generateHash(type: string, value: string): string {
  // 타입별 정규화
  const normalized = normalizeValue(type, value);
  return crypto
    .createHash('sha256')
    .update(`${type}:${normalized}`)
    .digest('hex');
}

/**
 * 값 정규화 (해시 생성 전)
 */
function normalizeValue(type: string, value: string): string {
  switch (type) {
    case 'PHONE':
      // 전화번호: 숫자만 추출
      return value.replace(/\D/g, '');
    
    case 'EMAIL':
      // 이메일: 소문자 변환
      return value.toLowerCase().trim();
    
    case 'SOCIAL_ID':
      // 소셜 ID: @ 제거, 소문자
      return value.replace('@', '').toLowerCase().trim();
    
    case 'BIRTHDATE':
      // 생년월일: YYYYMMDD 형식
      return value.replace(/\D/g, '');
    
    default:
      // 기본: 소문자, 공백 제거
      return value.toLowerCase().trim();
  }
}

/**
 * 값 마스킹 (UI 표시용)
 */
export function maskValue(type: string, value: string): string {
  if (!value) return '***';
  
  switch (type) {
    case 'PHONE':
      // 010-****-5678
      const digits = value.replace(/\D/g, '');
      if (digits.length >= 10) {
        return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
      }
      return '***-****-****';
    
    case 'EMAIL':
      // a***@example.com
      const [local, domain] = value.split('@');
      if (local && domain) {
        const maskedLocal = local[0] + '***';
        return `${maskedLocal}@${domain}`;
      }
      return '***@***.***';
    
    case 'SOCIAL_ID':
      // @u***
      const handle = value.replace('@', '');
      if (handle.length > 1) {
        return `@${handle[0]}***`;
      }
      return '@***';
    
    case 'BIRTHDATE':
      // 19**년 **월
      const year = value.slice(0, 4);
      if (year) {
        return `${year.slice(0, 2)}**년생`;
      }
      return '****년생';
    
    case 'NICKNAME':
      // 김**
      if (value.length > 0) {
        return value[0] + '*'.repeat(Math.min(value.length - 1, 2));
      }
      return '***';
    
    case 'COMPANY':
      // 삼*** 또는 S***
      if (value.length > 0) {
        return value[0] + '***';
      }
      return '***';
    
    default:
      // 기본 마스킹
      if (value.length > 2) {
        return value.slice(0, 1) + '***';
      }
      return '***';
  }
}

/**
 * 개인정보 데이터 구조화
 */
export interface PersonalData {
  // 전화번호
  phoneNumber?: string;
  phoneCarrier?: string;
  
  // 이메일
  email?: string;
  emailVerified?: boolean;
  
  // 소셜
  socialId?: string;
  socialPlatform?: string;
  
  // 생년월일
  birthdate?: string; // YYYY-MM-DD
  
  // 위치
  locationName?: string;
  locationLat?: number;
  locationLng?: number;
  appearance?: string;
  
  // 회사/학교
  companyName?: string;
  companyEmail?: string;
  department?: string;
  schoolName?: string;
  major?: string;
  studentId?: string;
  
  // 알바
  partTimePlace?: string;
  partTimeRole?: string;
  workingHours?: string;
  
  // 게임/플랫폼
  gamerId?: string;
  platformId?: string;
  
  // 기타
  nickname?: string;
  additionalInfo?: any;
}

/**
 * 개인정보 암호화 헬퍼
 */
export function encryptPersonalData(data: PersonalData) {
  return encryptData(data);
}

/**
 * 개인정보 복호화 헬퍼
 */
export function decryptPersonalData(
  encrypted: string,
  iv: string,
  tag: string
): PersonalData {
  return decryptData(encrypted, iv, tag) as PersonalData;
}

/**
 * 복합 해시 생성 (여러 조건 매칭용)
 */
export function generateCompositeHash(
  values: { type: string; value: string }[]
): string {
  const combined = values
    .map(({ type, value }) => `${type}:${normalizeValue(type, value)}`)
    .join('|');
  
  return crypto
    .createHash('sha256')
    .update(combined)
    .digest('hex');
}

/**
 * 안전한 비교 (타이밍 공격 방지)
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}