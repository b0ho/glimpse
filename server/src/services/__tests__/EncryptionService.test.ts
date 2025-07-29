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
      expect(hashed.length).toBeGreaterThan(50); // bcrypt hashes are long

      const isValid = await encryptionService.verifyPassword(password, hashed);
      expect(isValid).toBe(true);
    });

    it('should reject wrong password', async () => {
      const password = 'correctPassword';
      const wrongPassword = 'wrongPassword';

      const hashed = await encryptionService.hashPassword(password);
      const isValid = await encryptionService.verifyPassword(wrongPassword, hashed);

      expect(isValid).toBe(false);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'samePassword';

      const hash1 = await encryptionService.hashPassword(password);
      const hash2 = await encryptionService.hashPassword(password);

      expect(hash1).not.toBe(hash2);

      // But both should verify correctly
      expect(await encryptionService.verifyPassword(password, hash1)).toBe(true);
      expect(await encryptionService.verifyPassword(password, hash2)).toBe(true);
    });
  });

  describe('generateToken', () => {
    it('should generate random tokens', () => {
      const token1 = encryptionService.generateToken();
      const token2 = encryptionService.generateToken();

      expect(token1).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
      expect(token1).toMatch(/^[a-f0-9]+$/);
    });

    it('should generate tokens of specified length', () => {
      const token16 = encryptionService.generateToken(16);
      const token48 = encryptionService.generateToken(48);

      expect(token16).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(token48).toHaveLength(96); // 48 bytes = 96 hex chars
    });
  });

  describe('hashData', () => {
    it('should hash data consistently', () => {
      const data = 'some data to hash';

      const hash1 = encryptionService.hashData(data);
      const hash2 = encryptionService.hashData(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 = 64 hex chars
    });

    it('should produce different hashes for different data', () => {
      const data1 = 'data1';
      const data2 = 'data2';

      const hash1 = encryptionService.hashData(data1);
      const hash2 = encryptionService.hashData(data2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('encryptSensitiveData and decryptSensitiveData', () => {
    it('should handle JSON objects', async () => {
      const sensitiveData = {
        cardNumber: '1234-5678-9012-3456',
        cvv: '123',
        expiry: '12/25',
      };

      const encrypted = await encryptionService.encryptSensitiveData(sensitiveData);
      expect(typeof encrypted).toBe('string');

      const decrypted = await encryptionService.decryptSensitiveData(encrypted);
      expect(decrypted).toEqual(sensitiveData);
    });

    it('should handle arrays', async () => {
      const sensitiveData = ['secret1', 'secret2', 'secret3'];

      const encrypted = await encryptionService.encryptSensitiveData(sensitiveData);
      const decrypted = await encryptionService.decryptSensitiveData(encrypted);

      expect(decrypted).toEqual(sensitiveData);
    });

    it('should handle nested objects', async () => {
      const sensitiveData = {
        user: {
          name: 'John Doe',
          ssn: '123-45-6789',
          accounts: [
            { bank: 'Bank A', number: '12345' },
            { bank: 'Bank B', number: '67890' },
          ],
        },
      };

      const encrypted = await encryptionService.encryptSensitiveData(sensitiveData);
      const decrypted = await encryptionService.decryptSensitiveData(encrypted);

      expect(decrypted).toEqual(sensitiveData);
    });
  });

  describe('generateSecureCode', () => {
    it('should generate 6-digit codes by default', () => {
      const code = encryptionService.generateSecureCode();

      expect(code).toMatch(/^\d{6}$/);
    });

    it('should generate codes of specified length', () => {
      const code4 = encryptionService.generateSecureCode(4);
      const code8 = encryptionService.generateSecureCode(8);

      expect(code4).toMatch(/^\d{4}$/);
      expect(code8).toMatch(/^\d{8}$/);
    });

    it('should generate different codes each time', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(encryptionService.generateSecureCode());
      }

      // Should have generated 100 unique codes (very unlikely to have duplicates)
      expect(codes.size).toBeGreaterThan(95);
    });
  });
});