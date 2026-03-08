import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SystemSetting } from './entities/system-setting.entity';
import { EncryptionService } from '../encryption/encryption.service';
import { RedisService } from '../redis/redis.service';
import { SettingItemDto } from './dto/update-settings.dto';

const REQUIRED_CATEGORIES = ['database', 'redis', 's3', 'ocr'];

const SENSITIVE_KEYS = ['password', 'api_key', 'secret_access_key', 'secret'];

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingRepo: Repository<SystemSetting>,
    private readonly encryptionService: EncryptionService,
    private readonly redisService: RedisService,
    private readonly dataSource: DataSource,
  ) {}

  async getByCategory(category: string): Promise<Array<{ key: string; value: string; isEncrypted: boolean }>> {
    const settings = await this.settingRepo.find({ where: { category } });
    return settings.map((s) => ({
      key: s.key,
      value: s.isEncrypted ? this.encryptionService.decrypt(s.value) : s.value,
      isEncrypted: s.isEncrypted,
    }));
  }

  async upsert(
    category: string,
    key: string,
    value: string,
    isEncrypted: boolean,
    userId: string,
  ): Promise<SystemSetting> {
    const storedValue = isEncrypted ? this.encryptionService.encrypt(value) : value;

    let setting = await this.settingRepo.findOne({ where: { category, key } });
    if (setting) {
      setting.value = storedValue;
      setting.isEncrypted = isEncrypted;
      setting.updatedBy = userId;
    } else {
      setting = this.settingRepo.create({
        category,
        key,
        value: storedValue,
        isEncrypted,
        updatedBy: userId,
      });
    }

    return this.settingRepo.save(setting);
  }

  async bulkUpsert(
    category: string,
    settings: SettingItemDto[],
    userId: string,
  ): Promise<void> {
    for (const item of settings) {
      const shouldEncrypt = item.isEncrypted ?? SENSITIVE_KEYS.includes(item.key);
      await this.upsert(category, item.key, item.value, shouldEncrypt, userId);
    }
  }

  async testConnection(
    category: string,
    config: Record<string, any>,
  ): Promise<{ success: boolean; message: string }> {
    try {
      switch (category) {
        case 'database':
          return await this.testDatabaseConnection(config);
        case 'redis':
          return await this.testRedisConnection(config);
        case 's3':
          return await this.testS3Connection(config);
        case 'ocr':
          return await this.testOcrConnection(config);
        case 'llm':
          return { success: true, message: 'LLM 연결 테스트는 LLM 모듈에서 수행합니다.' };
        default:
          throw new BadRequestException(`지원하지 않는 카테고리입니다: ${category}`);
      }
    } catch (error) {
      this.logger.error(`Connection test failed for ${category}`, error.stack);
      return {
        success: false,
        message: error.message || '연결 테스트에 실패했습니다.',
      };
    }
  }

  async isSetupRequired(): Promise<boolean> {
    for (const category of REQUIRED_CATEGORIES) {
      const count = await this.settingRepo.count({ where: { category } });
      if (count === 0) {
        return true;
      }
    }
    return false;
  }

  async getStatus(): Promise<
    Array<{ category: string; configured: boolean; connected: boolean | null }>
  > {
    const categories = ['database', 'redis', 's3', 'ocr', 'llm'];
    const results: Array<{ category: string; configured: boolean; connected: boolean | null }> = [];

    for (const category of categories) {
      const count = await this.settingRepo.count({ where: { category } });
      const configured = count > 0;

      let connected: boolean | null = null;
      if (configured) {
        try {
          const settings = await this.getByCategory(category);
          const config = Object.fromEntries(settings.map((s) => [s.key, s.value]));
          const result = await this.testConnection(category, config);
          connected = result.success;
        } catch {
          connected = false;
        }
      }

      results.push({ category, configured, connected });
    }

    return results;
  }

  private async testDatabaseConnection(
    config: Record<string, any>,
  ): Promise<{ success: boolean; message: string }> {
    const { Client } = await import('pg');
    const client = new Client({
      host: config.host || 'localhost',
      port: parseInt(config.port, 10) || 5432,
      user: config.username,
      password: config.password,
      database: config.database || 'postgres',
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();
      await client.query('SELECT 1');
      return { success: true, message: '데이터베이스 연결 성공' };
    } finally {
      await client.end().catch(() => {});
    }
  }

  private async testRedisConnection(
    config: Record<string, any>,
  ): Promise<{ success: boolean; message: string }> {
    const Redis = (await import('ioredis')).default;
    const client = new Redis({
      host: config.host || 'localhost',
      port: parseInt(config.port, 10) || 6379,
      password: config.password || undefined,
      connectTimeout: 5000,
      lazyConnect: true,
    });

    try {
      await client.connect();
      const result = await client.ping();
      if (result === 'PONG') {
        return { success: true, message: 'Redis 연결 성공' };
      }
      return { success: false, message: `Redis 응답 이상: ${result}` };
    } finally {
      client.disconnect();
    }
  }

  private async testS3Connection(
    config: Record<string, any>,
  ): Promise<{ success: boolean; message: string }> {
    const { S3Client, HeadBucketCommand } = await import('@aws-sdk/client-s3');
    const s3Config: any = {
      region: config.region || 'ap-northeast-2',
      credentials: {
        accessKeyId: config.access_key_id || config.accessKeyId,
        secretAccessKey: config.secret_access_key || config.secretAccessKey,
      },
    };

    if (config.endpoint) {
      s3Config.endpoint = config.endpoint;
      s3Config.forcePathStyle = true;
    }

    const s3 = new S3Client(s3Config);
    try {
      await s3.send(new HeadBucketCommand({ Bucket: config.bucket }));
      return { success: true, message: 'S3 연결 성공' };
    } finally {
      s3.destroy();
    }
  }

  private async testOcrConnection(
    config: Record<string, any>,
  ): Promise<{ success: boolean; message: string }> {
    const endpoint = config.endpoint || config.api_url;
    if (!endpoint) {
      return { success: false, message: 'OCR 엔드포인트가 설정되지 않았습니다.' };
    }

    try {
      const url = new URL(endpoint);
      const http = url.protocol === 'https:' ? await import('https') : await import('http');

      return new Promise((resolve) => {
        const req = http.request(
          { hostname: url.hostname, port: url.port, path: '/', method: 'HEAD', timeout: 5000 },
          (res) => {
            resolve({ success: true, message: `OCR 엔드포인트 접근 가능 (HTTP ${res.statusCode})` });
          },
        );
        req.on('error', (err) => {
          resolve({ success: false, message: `OCR 엔드포인트 접근 불가: ${err.message}` });
        });
        req.on('timeout', () => {
          req.destroy();
          resolve({ success: false, message: 'OCR 엔드포인트 응답 시간 초과' });
        });
        req.end();
      });
    } catch (error) {
      return { success: false, message: `잘못된 OCR 엔드포인트 URL: ${error.message}` };
    }
  }
}
