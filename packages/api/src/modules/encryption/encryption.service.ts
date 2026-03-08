import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
  createHash,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

@Injectable()
export class EncryptionService {
  private key: Buffer;

  constructor(private configService: ConfigService) {
    const encryptionKey = this.configService.get<string>(
      'ENCRYPTION_KEY',
      'default-encryption-key-change-in-production',
    );
    this.key = scryptSync(encryptionKey, 'corporate-card-salt', KEY_LENGTH);
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  maskCardNumber(cardNumber: string): string {
    const digits = cardNumber.replace(/\D/g, '');
    const last4 = digits.slice(-4);
    return `**** **** **** ${last4}`;
  }

  getCardLastFour(cardNumber: string): string {
    return cardNumber.replace(/\D/g, '').slice(-4);
  }

  maskBusinessNumber(businessNumber: string): string {
    const digits = businessNumber.replace(/\D/g, '');
    if (digits.length !== 10) return '***-**-*****';
    return `${digits.slice(0, 3)}-**-*****`;
  }

  maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) return '***-****-****';
    return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
  }
}
