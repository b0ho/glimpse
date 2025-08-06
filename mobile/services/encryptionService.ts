import CryptoJS from 'crypto-js';

/**
 * 암호화 서비스 클래스
 * @class EncryptionService
 * @description AES 암호화/복호화, 해시, HMAC 서명 기능 제공
 */
export class EncryptionService {
  /**
   * 암호화 키
   * @private
   * @type {string}
   */
  private encryptionKey: string;

  /**
   * EncryptionService 생성자
   * @constructor
   * @description 환경 변수에서 암호화 키를 가져오거나 기본값 사용
   */
  constructor() {
    // In production, this should come from secure storage or environment variable
    this.encryptionKey = 'default-encryption-key-change-in-production';
  }

  /**
   * 메시지 암호화
   * @async
   * @param {string} message - 암호화할 메시지
   * @returns {Promise<string>} 암호화된 메시지
   * @throws {Error} 암호화 실패 시
   * @description AES 알고리즘을 사용하여 메시지를 암호화
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
   * 메시지 복호화
   * @async
   * @param {string} encryptedMessage - 암호화된 메시지
   * @returns {Promise<string>} 복호화된 메시지
   * @throws {Error} 복호화 실패 시
   * @description AES 알고리즘을 사용하여 메시지를 복호화
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
   * 보안 랜덤 키 생성
   * @returns {string} 256비트 랜덤 키
   * @description 암호학적으로 안전한 랜덤 키 생성
   */
  generateSecureKey(): string {
    return CryptoJS.lib.WordArray.random(256/8).toString();
  }

  /**
   * 값 해시화
   * @param {string} value - 해시할 값
   * @returns {string} SHA256 해시값
   * @description SHA256 알고리즘을 사용하여 값을 해시화
   */
  hash(value: string): string {
    return CryptoJS.SHA256(value).toString();
  }

  /**
   * HMAC 서명 생성
   * @param {string} message - 서명할 메시지
   * @param {string} secret - 비밀 키
   * @returns {string} HMAC-SHA256 서명
   * @description 메시지 인증을 위한 HMAC 서명 생성
   */
  createHMAC(message: string, secret: string): string {
    return CryptoJS.HmacSHA256(message, secret).toString();
  }

  /**
   * HMAC 서명 검증
   * @param {string} message - 원본 메시지
   * @param {string} signature - 검증할 서명
   * @param {string} secret - 비밀 키
   * @returns {boolean} 서명 유효성 여부
   * @description HMAC 서명의 유효성을 검증
   */
  verifyHMAC(message: string, signature: string, secret: string): boolean {
    const expectedSignature = this.createHMAC(message, secret);
    return expectedSignature === signature;
  }
}