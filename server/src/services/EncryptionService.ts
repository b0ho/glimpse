import * as crypto from 'crypto';
import env from '../config/env';

/**
 * 암호화 서비스 - AES-256-GCM 기반 데이터 암호화
 * @class EncryptionService
 */
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyDerivationIterations = 100000;
  private readonly saltLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  
  // Master key from environment
  private readonly masterKey: Buffer;
  
  constructor() {
    if (!env.ENCRYPTION_KEY || env.ENCRYPTION_KEY.length !== 32) {
      throw new Error('Invalid encryption key: must be exactly 32 characters');
    }
    this.masterKey = Buffer.from(env.ENCRYPTION_KEY);
  }
  
  /**
   * AES-256-GCM으로 데이터 암호화
   * @param {string} data - 암호화할 데이터
   * @param {string} [additionalData] - 추가 인증 데이터 (AAD)
   * @returns {string} base64로 인코딩된 암호화 데이터
   * @throws {Error} 암호화 실패 시
   */
  encrypt(data: string, additionalData?: string): string {
    try {
      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);
      
      // Add additional authenticated data if provided
      if (additionalData) {
        cipher.setAAD(Buffer.from(additionalData), { plaintextLength: Buffer.byteLength(data) });
      }
      
      // Encrypt data
      const encrypted = Buffer.concat([
        cipher.update(data, 'utf8'),
        cipher.final()
      ]);
      
      // Get authentication tag
      const authTag = cipher.getAuthTag();
      
      // Combine IV + authTag + encrypted data
      const combined = Buffer.concat([iv, authTag, encrypted]);
      
      // Return base64 encoded
      return combined.toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }
  
  /**
   * AES-256-GCM으로 암호화된 데이터 복호화
   * @param {string} encryptedData - base64로 인코딩된 암호화 데이터
   * @param {string} [additionalData] - 추가 인증 데이터 (AAD)
   * @returns {string} 복호화된 데이터
   * @throws {Error} 복호화 실패 시
   */
  decrypt(encryptedData: string, additionalData?: string): string {
    try {
      // Decode from base64
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract components
      const iv = combined.slice(0, this.ivLength);
      const authTag = combined.slice(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = combined.slice(this.ivLength + this.tagLength);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv);
      decipher.setAuthTag(authTag);
      
      // Add additional authenticated data if provided
      if (additionalData) {
        decipher.setAAD(Buffer.from(additionalData), { plaintextLength: encrypted.length });
      }
      
      // Decrypt data
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }
  
  /**
   * 안전한 랜덤 키 생성
   * @param {number} [length=32] - 키 길이 (바이트)
   * @returns {string} 16진수 문자열 키
   */
  generateKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
  
  /**
   * SHA-256으로 데이터 해시
   * @param {string} data - 해시할 데이터
   * @returns {string} 16진수 해시 값
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  /**
   * PBKDF2로 비밀번호 해시
   * @param {string} password - 비밀번호
   * @param {string} [salt] - 소금 (선택사항, 미제공시 자동 생성)
   * @returns {Promise<{hash: string, salt: string}>} 해시와 소금
   */
  async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const useSalt = salt || crypto.randomBytes(this.saltLength).toString('hex');
    
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, useSalt, this.keyDerivationIterations, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        else resolve({
          hash: derivedKey.toString('hex'),
          salt: useSalt
        });
      });
    });
  }
  
  /**
   * 비밀번호 해시 검증
   * @param {string} password - 검증할 비밀번호
   * @param {string} hash - 비교할 해시
   * @param {string} salt - 사용된 소금
   * @returns {Promise<boolean>} 일치 여부
   */
  async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const result = await this.hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(result.hash), Buffer.from(hash));
  }
  
  /**
   * 안전한 랜덤 토큰 생성
   * @param {number} [length=32] - 토큰 길이 (바이트)
   * @returns {string} base64url 인코딩된 토큰
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }
  
  /**
   * 랜덤 숫자 코드 생성 (SMS 인증용)
   * @param {number} [length=6] - 코드 길이
   * @returns {string} 숫자 코드
   */
  generateRandomCode(length: number = 6): string {
    const characters = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }
  
  /**
   * HMAC 서명 생성
   * @param {string} data - 서명할 데이터
   * @param {string} [key=env.JWT_SECRET] - HMAC 키
   * @returns {string} 16진수 HMAC 서명
   */
  createHmac(data: string, key: string = env.JWT_SECRET): string {
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }
  
  /**
   * HMAC 서명 검증
   * @param {string} data - 원본 데이터
   * @param {string} signature - 검증할 서명
   * @param {string} [key=env.JWT_SECRET] - HMAC 키
   * @returns {boolean} 서명 유효성
   */
  verifyHmac(data: string, signature: string, key: string = env.JWT_SECRET): boolean {
    const expectedSignature = this.createHmac(data, key);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }
  
  /**
   * 객체의 민감한 필드 암호화
   * @template T
   * @param {T} obj - 원본 객체
   * @param {(keyof T)[]} fieldsToEncrypt - 암호화할 필드 명
   * @returns {T} 필드가 암호화된 객체
   */
  encryptObject<T extends Record<string, any>>(
    obj: T,
    fieldsToEncrypt: (keyof T)[]
  ): T {
    const encrypted = { ...obj };
    
    for (const field of fieldsToEncrypt) {
      if (obj[field] !== undefined && obj[field] !== null) {
        encrypted[field] = this.encrypt(String(obj[field])) as any;
      }
    }
    
    return encrypted;
  }
  
  /**
   * 객체의 암호화된 필드 복호화
   * @template T
   * @param {T} obj - 암호화된 객체
   * @param {(keyof T)[]} fieldsToDecrypt - 복호화할 필드 명
   * @returns {T} 필드가 복호화된 객체
   */
  decryptObject<T extends Record<string, any>>(
    obj: T,
    fieldsToDecrypt: (keyof T)[]
  ): T {
    const decrypted = { ...obj };
    
    for (const field of fieldsToDecrypt) {
      if (obj[field] !== undefined && obj[field] !== null) {
        try {
          decrypted[field] = this.decrypt(String(obj[field])) as any;
        } catch (error) {
          console.error(`Failed to decrypt field ${String(field)}`);
          // Keep encrypted value if decryption fails
        }
      }
    }
    
    return decrypted;
  }
  
  /**
   * 사용자 데이터로부터 결정적 암호화 키 생성
   * 매칭된 사용자 간 종단간 암호화에 사용
   * @param {string} userId1 - 첫 번째 사용자 ID
   * @param {string} userId2 - 두 번째 사용자 ID
   * @returns {string} 매칭 키
   */
  generateMatchKey(userId1: string, userId2: string): string {
    // Sort user IDs to ensure same key regardless of order
    const sortedIds = [userId1, userId2].sort();
    const combined = sortedIds.join(':');
    
    // Generate deterministic key using HMAC
    return this.createHmac(combined, env.ENCRYPTION_KEY);
  }
  
  /**
   * 특정 매칭을 위한 메시지 암호화
   * @param {string} message - 암호화할 메시지
   * @param {string} matchKey - 매칭 키
   * @returns {string} base64로 인코딩된 암호화 메시지
   */
  encryptMessage(message: string, matchKey: string): string {
    // Use first 32 bytes of match key as encryption key
    const messageKey = Buffer.from(matchKey.substring(0, 64), 'hex');
    
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, messageKey, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(message, 'utf8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    const combined = Buffer.concat([iv, authTag, encrypted]);
    
    return combined.toString('base64');
  }
  
  /**
   * 특정 매칭을 위한 메시지 복호화
   * @param {string} encryptedMessage - 암호화된 메시지
   * @param {string} matchKey - 매칭 키
   * @returns {string} 복호화된 메시지
   * @throws {Error} 복호화 실패 시
   */
  decryptMessage(encryptedMessage: string, matchKey: string): string {
    try {
      const messageKey = Buffer.from(matchKey.substring(0, 64), 'hex');
      const combined = Buffer.from(encryptedMessage, 'base64');
      
      const iv = combined.slice(0, this.ivLength);
      const authTag = combined.slice(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = combined.slice(this.ivLength + this.tagLength);
      
      const decipher = crypto.createDecipheriv(this.algorithm, messageKey, iv);
      decipher.setAuthTag(authTag);
      
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      console.error('Message decryption error:', error);
      throw new Error('Failed to decrypt message');
    }
  }
}

// Export singleton instance for backward compatibility
export const encryptionService = new EncryptionService();