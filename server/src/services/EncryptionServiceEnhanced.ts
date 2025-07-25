import * as crypto from 'crypto';
import { env } from '../config/env';

export class EncryptionServiceEnhanced {
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
   * Encrypt data with AES-256-GCM
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
   * Decrypt data encrypted with AES-256-GCM
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
   * Generate a secure random key
   */
  generateKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
  
  /**
   * Hash data with SHA-256
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  /**
   * Hash password with PBKDF2
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
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const result = await this.hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(result.hash), Buffer.from(hash));
  }
  
  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }
  
  /**
   * Create HMAC signature
   */
  createHmac(data: string, key: string = env.JWT_SECRET): string {
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }
  
  /**
   * Verify HMAC signature
   */
  verifyHmac(data: string, signature: string, key: string = env.JWT_SECRET): boolean {
    const expectedSignature = this.createHmac(data, key);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }
  
  /**
   * Encrypt sensitive fields in an object
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
   * Decrypt sensitive fields in an object
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
   * Generate deterministic encryption key from user data
   * Used for end-to-end encryption between matched users
   */
  generateMatchKey(userId1: string, userId2: string): string {
    // Sort user IDs to ensure same key regardless of order
    const sortedIds = [userId1, userId2].sort();
    const combined = `${sortedIds[0]}:${sortedIds[1]}:${env.ENCRYPTION_KEY}`;
    
    // Generate deterministic key
    return crypto.createHash('sha256').update(combined).digest('hex').slice(0, 32);
  }
  
  /**
   * Encrypt file with stream (for large files)
   */
  createEncryptStream(key?: Buffer): { cipher: crypto.Cipher; iv: Buffer } {
    const iv = crypto.randomBytes(this.ivLength);
    const useKey = key || this.masterKey;
    const cipher = crypto.createCipheriv(this.algorithm, useKey, iv);
    
    return { cipher, iv };
  }
  
  /**
   * Decrypt file with stream (for large files)
   */
  createDecryptStream(iv: Buffer, authTag: Buffer, key?: Buffer): crypto.Decipher {
    const useKey = key || this.masterKey;
    const decipher = crypto.createDecipheriv(this.algorithm, useKey, iv);
    decipher.setAuthTag(authTag);
    
    return decipher;
  }
}

// Export singleton instance
export const encryptionService = new EncryptionServiceEnhanced();