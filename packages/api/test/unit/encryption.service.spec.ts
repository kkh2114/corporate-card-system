import { EncryptionService } from '../../src/modules/encryption/encryption.service';
import { ConfigService } from '@nestjs/config';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(() => {
    const configService = {
      get: jest.fn().mockReturnValue('test-encryption-key-32chars-long!'),
    } as unknown as ConfigService;
    service = new EncryptionService(configService);
  });

  describe('encrypt / decrypt', () => {
    it('should encrypt and decrypt a card number correctly', () => {
      const cardNumber = '1234-5678-9012-3456';
      const encrypted = service.encrypt(cardNumber);
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(cardNumber);
    });

    it('should encrypt and decrypt a business number correctly', () => {
      const bizNumber = '123-45-67890';
      const encrypted = service.encrypt(bizNumber);
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(bizNumber);
    });

    it('should produce different ciphertext for same plaintext (random IV)', () => {
      const plaintext = 'sensitive-data';
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);
      expect(encrypted1).not.toBe(encrypted2);
      // Both should decrypt to the same value
      expect(service.decrypt(encrypted1)).toBe(plaintext);
      expect(service.decrypt(encrypted2)).toBe(plaintext);
    });

    it('should produce ciphertext in iv:authTag:data format', () => {
      const encrypted = service.encrypt('test');
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);
      // IV = 16 bytes = 32 hex chars
      expect(parts[0]).toHaveLength(32);
      // AuthTag = 16 bytes = 32 hex chars
      expect(parts[1]).toHaveLength(32);
      // Encrypted data should be non-empty hex
      expect(parts[2].length).toBeGreaterThan(0);
    });

    it('should throw on tampered ciphertext', () => {
      const encrypted = service.encrypt('test-data');
      const parts = encrypted.split(':');
      // Tamper with the encrypted data
      const tampered = `${parts[0]}:${parts[1]}:ff${parts[2].slice(2)}`;
      expect(() => service.decrypt(tampered)).toThrow();
    });

    it('should throw on invalid format', () => {
      expect(() => service.decrypt('invalid-data')).toThrow('Invalid encrypted data format');
      expect(() => service.decrypt('a:b')).toThrow('Invalid encrypted data format');
    });

    it('should handle empty string', () => {
      const encrypted = service.encrypt('');
      expect(service.decrypt(encrypted)).toBe('');
    });

    it('should handle unicode characters', () => {
      const korean = '법인카드 번호 테스트';
      const encrypted = service.encrypt(korean);
      expect(service.decrypt(encrypted)).toBe(korean);
    });
  });

  describe('hash', () => {
    it('should produce consistent SHA-256 hash', () => {
      const hash1 = service.hash('test-value');
      const hash2 = service.hash('test-value');
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 = 64 hex chars
    });

    it('should produce different hashes for different inputs', () => {
      expect(service.hash('value-a')).not.toBe(service.hash('value-b'));
    });
  });

  describe('maskCardNumber', () => {
    it('should mask all but last 4 digits', () => {
      expect(service.maskCardNumber('1234-5678-9012-3456')).toBe('**** **** **** 3456');
    });

    it('should handle card number without dashes', () => {
      expect(service.maskCardNumber('1234567890123456')).toBe('**** **** **** 3456');
    });
  });

  describe('getCardLastFour', () => {
    it('should extract last 4 digits', () => {
      expect(service.getCardLastFour('1234-5678-9012-3456')).toBe('3456');
    });
  });

  describe('maskBusinessNumber', () => {
    it('should mask business number with 10 digits', () => {
      expect(service.maskBusinessNumber('123-45-67890')).toBe('123-**-*****');
    });

    it('should return fully masked for invalid length', () => {
      expect(service.maskBusinessNumber('12345')).toBe('***-**-*****');
    });
  });

  describe('maskPhone', () => {
    it('should mask middle digits of phone number', () => {
      expect(service.maskPhone('010-1234-5678')).toBe('010-****-5678');
    });

    it('should return fully masked for short numbers', () => {
      expect(service.maskPhone('12345')).toBe('***-****-****');
    });
  });

  describe('cross-instance decryption', () => {
    it('should fail to decrypt with a different key', () => {
      const otherConfigService = {
        get: jest.fn().mockReturnValue('different-encryption-key-here!!'),
      } as unknown as ConfigService;
      const otherService = new EncryptionService(otherConfigService);

      const encrypted = service.encrypt('secret');
      expect(() => otherService.decrypt(encrypted)).toThrow();
    });
  });
});
