import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * 암호화 서비스 - AES-256-GCM 기반 데이터 암호화
 * 
 * 민감한 데이터의 암호화/복호화, 비밀번호 해싱, 토큰 생성 등을 담당합니다.
 */
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyDerivationIterations = 100000;
  private readonly saltLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  
  // Master key from environment
  private readonly masterKey: Buffer;
  
  constructor(private readonly configService: ConfigService) {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!encryptionKey || encryptionKey.length !== 32) {
      throw new Error('Invalid encryption key: must be exactly 32 characters');
    }
    this.masterKey = Buffer.from(encryptionKey);
  }
  
  /**
   * AES-256-GCM으로 데이터 암호화
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
   */
  generateKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
  
  /**
   * SHA-256으로 데이터 해시
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  /**
   * PBKDF2로 비밀번호 해시
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
   */
  async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const result = await this.hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(result.hash), Buffer.from(hash));
  }
  
  /**
   * 안전한 랜덤 토큰 생성
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }
  
  /**
   * 랜덤 숫자 코드 생성 (SMS 인증용)
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
   */
  createHmac(data: string, key?: string): string {
    const hmacKey = key || this.configService.get<string>('JWT_SECRET', '');
    return crypto.createHmac('sha256', hmacKey).update(data).digest('hex');
  }
  
  /**
   * HMAC 서명 검증
   */
  verifyHmac(data: string, signature: string, key?: string): boolean {
    const expectedSignature = this.createHmac(data, key);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }
  
  /**
   * 객체의 민감한 필드 암호화
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
   */
  generateMatchKey(userId1: string, userId2: string): string {
    // Sort user IDs to ensure same key regardless of order
    const sortedIds = [userId1, userId2].sort();
    const combined = sortedIds.join(':');
    
    // Generate deterministic key using HMAC
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY', '');
    return this.createHmac(combined, encryptionKey);
  }
  
  /**
   * 특정 매칭을 위한 메시지 암호화
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
