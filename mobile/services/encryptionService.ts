import CryptoJS from 'crypto-js';

export class EncryptionService {
  private encryptionKey: string;

  constructor() {
    // In production, this should come from secure storage or environment variable
    this.encryptionKey = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
  }

  /**
   * Encrypt a message before sending
   */
  async encryptMessage(message: string): Promise<string> {
    try {
      const encrypted = CryptoJS.AES.encrypt(message, this.encryptionKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Failed to encrypt message:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt a received message
   */
  async decryptMessage(encryptedMessage: string): Promise<string> {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedMessage, this.encryptionKey);
      const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!plaintext) {
        throw new Error('Failed to decrypt message');
      }
      
      return plaintext;
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Generate a secure random key
   */
  generateSecureKey(): string {
    return CryptoJS.lib.WordArray.random(256/8).toString();
  }

  /**
   * Hash a value (for checksums, etc.)
   */
  hash(value: string): string {
    return CryptoJS.SHA256(value).toString();
  }

  /**
   * Create HMAC signature
   */
  createHMAC(message: string, secret: string): string {
    return CryptoJS.HmacSHA256(message, secret).toString();
  }

  /**
   * Verify HMAC signature
   */
  verifyHMAC(message: string, signature: string, secret: string): boolean {
    const expectedSignature = this.createHMAC(message, secret);
    return expectedSignature === signature;
  }
}