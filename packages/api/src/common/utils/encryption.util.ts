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

export class EncryptionUtil {
  private key: Buffer;

  constructor(encryptionKey: string) {
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
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  static hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  static maskCardNumber(cardNumber: string): string {
    const last4 = cardNumber.replace(/\D/g, '').slice(-4);
    return `**** **** **** ${last4}`;
  }

  static maskBusinessNumber(businessNumber: string): string {
    const digits = businessNumber.replace(/\D/g, '');
    if (digits.length !== 10) return '***-**-*****';
    return `${digits.slice(0, 3)}-**-*****`;
  }
}
