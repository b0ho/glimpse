import { EncryptionService } from '../EncryptionService';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;

  beforeEach(() => {
    encryptionService = new EncryptionService();
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text correctly', async () => {
      const originalText = 'Hello, this is a secret message!';

      const encrypted = await encryptionService.encrypt(originalText);
      expect(encrypted).not.toBe(originalText);
      expect(encrypted).toMatch(/^[a-f0-9]+:[a-f0-9]+$/); // format: iv:encryptedData

      const decrypted = await encryptionService.decrypt(encrypted);
      expect(decrypted).toBe(originalText);
    });

    it('should handle empty strings', async () => {
      const originalText = '';

      const encrypted = await encryptionService.encrypt(originalText);
      const decrypted = await encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it('should handle special characters and emojis', async () => {
      const originalText = 'Special chars: !@#$%^&*() 한글 テスト 🎉🔒';

      const encrypted = await encryptionService.encrypt(originalText);
      const decrypted = await encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it('should handle long texts', async () => {
      const originalText = 'Lorem ipsum '.repeat(100);

      const encrypted = await encryptionService.encrypt(originalText);
      const decrypted = await encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it('should produce different encrypted values for same input', async () => {
      const originalText = 'Same text';

      const encrypted1 = await encryptionService.encrypt(originalText);
      const encrypted2 = await encryptionService.encrypt(originalText);

      // Different IVs should produce different encrypted values
      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to the same value
      expect(await encryptionService.decrypt(encrypted1)).toBe(originalText);
      expect(await encryptionService.decrypt(encrypted2)).toBe(originalText);
    });

    it('should throw error for invalid encrypted data', async () => {
      await expect(
        encryptionService.decrypt('invalid-data')
      ).rejects.toThrow();

      await expect(
        encryptionService.decrypt('invalid:format:data')
      ).rejects.toThrow();
    });
  });

  describe('hashPassword and verifyPassword', () => {
    it('should hash and verify password correctly', async () => {
      const password = 'mySecurePassword123!';

      const hashed = await encryptionService.hashPassword(password);
      expect(hashed).not.toBe(password);
      expect(hashed.hash.length).toBeGreaterThan(50); // bcrypt hashes are long

      const isValid = await encryptionService.verifyPassword(password, hashed.hash, hashed.salt);
      expect(isValid).toBe(true);
    });

    it('should reject wrong password', async () => {
      const password = 'correctPassword';
      const wrongPassword = 'wrongPassword';

      const hashed = await encryptionService.hashPassword(password);
      const isValid = await encryptionService.verifyPassword(wrongPassword, hashed.hash, hashed.salt);

      expect(isValid).toBe(false);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'samePassword';

      const hash1 = await encryptionService.hashPassword(password);
      const hash2 = await encryptionService.hashPassword(password);

      expect(hash1).not.toBe(hash2);

      // But both should verify correctly
      expect(await encryptionService.verifyPassword(password, hash1.hash, hash1.salt)).toBe(true);
      expect(await encryptionService.verifyPassword(password, hash2.hash, hash2.salt)).toBe(true);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate random tokens', () => {
      const token1 = encryptionService.generateSecureToken();
      const token2 = encryptionService.generateSecureToken();

      expect(token1).not.toBe(token2);
      expect(token1).toMatch(/^[A-Za-z0-9_-]+$/); // base64url format
    });

    it('should generate tokens of specified length', () => {
      const token16 = encryptionService.generateSecureToken(16);
      const token48 = encryptionService.generateSecureToken(48);

      // base64url encoding results in roughly 4/3 of the input bytes
      expect(token16.length).toBeGreaterThan(20); // approximately 22
      expect(token48.length).toBeGreaterThan(60); // approximately 64
    });
  });

  describe('hash', () => {
    it('should hash data consistently', () => {
      const data = 'some data to hash';

      const hash1 = encryptionService.hash(data);
      const hash2 = encryptionService.hash(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 = 64 hex chars
    });

    it('should produce different hashes for different data', () => {
      const data1 = 'data1';
      const data2 = 'data2';

      const hash1 = encryptionService.hash(data1);
      const hash2 = encryptionService.hash(data2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('encryptObject and decryptObject', () => {
    it('should handle objects with specific fields', async () => {
      const sensitiveData = {
        cardNumber: '1234-5678-9012-3456',
        cvv: '123',
        expiry: '12/25',
        userId: 'user123',
      };

      const encrypted = encryptionService.encryptObject(sensitiveData, ['cardNumber', 'cvv']);
      expect(encrypted.cardNumber).not.toBe(sensitiveData.cardNumber);
      expect(encrypted.cvv).not.toBe(sensitiveData.cvv);
      expect(encrypted.expiry).toBe(sensitiveData.expiry); // not encrypted
      expect(encrypted.userId).toBe(sensitiveData.userId); // not encrypted

      const decrypted = encryptionService.decryptObject(encrypted, ['cardNumber', 'cvv']);
      expect(decrypted).toEqual(sensitiveData);
    });
  });

  describe('generateRandomCode', () => {
    it('should generate 6-digit codes by default', () => {
      const code = encryptionService.generateRandomCode();

      expect(code).toMatch(/^\d{6}$/);
    });

    it('should generate codes of specified length', () => {
      const code4 = encryptionService.generateRandomCode(4);
      const code8 = encryptionService.generateRandomCode(8);

      expect(code4).toMatch(/^\d{4}$/);
      expect(code8).toMatch(/^\d{8}$/);
    });

    it('should generate different codes each time', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(encryptionService.generateRandomCode());
      }

      // Should have generated many unique codes
      expect(codes.size).toBeGreaterThan(50);
    });
  });

  describe('generateMatchKey and message encryption', () => {
    it('should generate consistent match keys', () => {
      const userId1 = 'user123';
      const userId2 = 'user456';

      const key1 = encryptionService.generateMatchKey(userId1, userId2);
      const key2 = encryptionService.generateMatchKey(userId2, userId1);

      expect(key1).toBe(key2); // Same key regardless of order
    });

    it('should encrypt and decrypt messages with match key', () => {
      const userId1 = 'user123';
      const userId2 = 'user456';
      const message = 'Hello, this is a secret message!';

      const matchKey = encryptionService.generateMatchKey(userId1, userId2);
      const encrypted = encryptionService.encryptMessage(message, matchKey);
      const decrypted = encryptionService.decryptMessage(encrypted, matchKey);

      expect(decrypted).toBe(message);
    });
  });
});