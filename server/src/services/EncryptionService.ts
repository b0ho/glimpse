import crypto from 'crypto';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16;  // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly secretKey: Buffer;

  constructor() {
    const envKey = process.env.ENCRYPTION_KEY;
    if (!envKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    // Derive a consistent key from the environment variable
    this.secretKey = crypto.scryptSync(envKey, 'glimpse-salt', this.keyLength);
  }

  async encrypt(text: string): Promise<string> {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
      cipher.setAAD(Buffer.from('glimpse-aad'));

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      // Combine iv + tag + encrypted data
      const result = iv.toString('hex') + tag.toString('hex') + encrypted;
      return result;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('암호화에 실패했습니다.');
    }
  }

  async decrypt(encryptedText: string): Promise<string> {
    try {
      // Extract iv, tag, and encrypted data
      const ivHex = encryptedText.slice(0, this.ivLength * 2);
      const tagHex = encryptedText.slice(this.ivLength * 2, (this.ivLength + this.tagLength) * 2);
      const encrypted = encryptedText.slice((this.ivLength + this.tagLength) * 2);

      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
      decipher.setAAD(Buffer.from('glimpse-aad'));
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('복호화에 실패했습니다.');
    }
  }

  generateHash(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha256').toString('hex');
    return `${actualSalt}:${hash}`;
  }

  verifyHash(data: string, hashedData: string): boolean {
    try {
      const [salt, hash] = hashedData.split(':');
      if (!salt || !hash) {
        return false;
      }
      const newHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha256').toString('hex');
      return hash === newHash;
    } catch (error) {
      return false;
    }
  }

  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, digits.length);
      otp += digits[randomIndex];
    }
    
    return otp;
  }

  encryptFile(buffer: Buffer): { encrypted: Buffer; key: string; iv: string } {
    const key = crypto.randomBytes(this.keyLength);
    const iv = crypto.randomBytes(this.ivLength);
    
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    
    return {
      encrypted,
      key: key.toString('hex'),
      iv: iv.toString('hex')
    };
  }

  decryptFile(encryptedBuffer: Buffer, keyHex: string, ivHex: string): Buffer {
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
    
    return decrypted;
  }

  generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    return { publicKey, privateKey };
  }

  signData(data: string, privateKey: string): string {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    return sign.sign(privateKey, 'hex');
  }

  verifySignature(data: string, signature: string, publicKey: string): boolean {
    try {
      const verify = crypto.createVerify('SHA256');
      verify.update(data);
      return verify.verify(publicKey, signature, 'hex');
    } catch (error) {
      return false;
    }
  }

  hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
    return `${salt}:${hash}`;
  }

  verifyPassword(password: string, hashedPassword: string): boolean {
    try {
      const [salt, hash] = hashedPassword.split(':');
      if (!salt || !hash) {
        return false;
      }
      const newHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
      return hash === newHash;
    } catch (error) {
      return false;
    }
  }

  generateApiKey(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(16).toString('hex');
    return `gk_${timestamp}_${random}`;
  }

  async encryptSensitiveData(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    return await this.encrypt(jsonString);
  }

  async decryptSensitiveData(encryptedData: string): Promise<any> {
    const decryptedString = await this.decrypt(encryptedData);
    return JSON.parse(decryptedString);
  }

  createHMACSignature(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  verifyHMACSignature(data: string, signature: string, secret: string): boolean {
    const expectedSignature = this.createHMACSignature(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}