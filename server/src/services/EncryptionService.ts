import * as crypto from 'crypto';
import env from '../config/env';

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
   * Generate random numeric code (for SMS verification)
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
    const combined = sortedIds.join(':');
    
    // Generate deterministic key using HMAC
    return this.createHmac(combined, env.ENCRYPTION_KEY);
  }
  
  /**
   * Encrypt message for a specific match
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
   * Decrypt message for a specific match
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