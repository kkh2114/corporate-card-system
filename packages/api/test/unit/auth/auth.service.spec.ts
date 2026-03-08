import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthService } from '@/modules/auth/auth.service';
import { EmployeesService } from '@/modules/employees/employees.service';
import { RedisService } from '@/modules/redis/redis.service';
import { Employee, EmployeeRole, EmployeeStatus } from '@/modules/employees/entities/employee.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let employeesService: jest.Mocked<Partial<EmployeesService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;
  let redisService: jest.Mocked<Partial<RedisService>>;

  const mockEmployee: Employee = {
    id: 'uuid-1',
    employeeId: 'EMP001',
    name: '홍길동',
    email: 'hong@company.com',
    password: '$2b$12$hashedpassword',
    department: '개발팀',
    position: '사원',
    phone: '010-1234-5678',
    status: EmployeeStatus.ACTIVE,
    role: EmployeeRole.EMPLOYEE,
    fcmToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    cardPolicy: null,
    transactions: [],
  };

  beforeEach(async () => {
    employeesService = {
      findByEmployeeIdWithPassword: jest.fn(),
      findByIdWithPassword: jest.fn(),
      updatePassword: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn(),
      decode: jest.fn(),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          JWT_ACCESS_EXPIRATION: 3600,
          JWT_REFRESH_SECRET: 'refresh-secret',
          JWT_REFRESH_EXPIRATION: 604800,
        };
        return config[key] ?? defaultValue;
      }),
    };

    redisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(undefined),
      keys: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: EmployeesService, useValue: employeesService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return employee when credentials are valid', async () => {
      employeesService.findByEmployeeIdWithPassword.mockResolvedValue(mockEmployee);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('EMP001', 'password123');

      expect(result).toEqual(mockEmployee);
      expect(redisService.del).toHaveBeenCalledWith('login:fail:EMP001');
    });

    it('should return null and increment fail counter on invalid password', async () => {
      employeesService.findByEmployeeIdWithPassword.mockResolvedValue(mockEmployee);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('EMP001', 'wrong-password');

      expect(result).toBeNull();
      expect(redisService.incr).toHaveBeenCalledWith('login:fail:EMP001');
    });

    it('should throw ForbiddenException when account is locked', async () => {
      redisService.get.mockResolvedValue('1'); // locked

      await expect(service.validateUser('EMP001', 'password123')).rejects.toThrow(
        ForbiddenException,
      );
      expect(employeesService.findByEmployeeIdWithPassword).not.toHaveBeenCalled();
    });

    it('should lock account after 5 failed attempts', async () => {
      employeesService.findByEmployeeIdWithPassword.mockResolvedValue(mockEmployee);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      redisService.incr.mockResolvedValue(5);

      await service.validateUser('EMP001', 'wrong');

      expect(redisService.set).toHaveBeenCalledWith(
        'login:locked:EMP001',
        '1',
        1800,
      );
    });

    it('should return null when employee not found', async () => {
      employeesService.findByEmployeeIdWithPassword.mockResolvedValue(null);

      const result = await service.validateUser('NONEXIST', 'password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return token response with access and refresh tokens', async () => {
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.login(mockEmployee);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.expiresIn).toBe(3600);
      expect(result.user.employeeId).toBe('EMP001');
      expect(result.user.name).toBe('홍길동');
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should store refresh token in Redis', async () => {
      await service.login(mockEmployee);

      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining('user:uuid-1:refresh:'),
        expect.any(String),
        604800,
      );
    });

    it('should evict oldest session when max sessions reached', async () => {
      redisService.keys.mockResolvedValue([
        'user:uuid-1:refresh:a',
        'user:uuid-1:refresh:b',
        'user:uuid-1:refresh:c',
        'user:uuid-1:refresh:d',
        'user:uuid-1:refresh:e',
      ]);

      await service.login(mockEmployee);

      expect(redisService.del).toHaveBeenCalledWith('user:uuid-1:refresh:a');
    });
  });

  describe('refresh', () => {
    const mockPayload = {
      sub: 'uuid-1',
      employeeId: 'EMP001',
      role: EmployeeRole.EMPLOYEE,
      tokenFamily: 'family-1',
    };

    it('should return new token pair on valid refresh', async () => {
      jwtService.verify.mockReturnValue(mockPayload);
      redisService.get.mockResolvedValue('stored-refresh-token');
      jwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await service.refresh('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(redisService.del).toHaveBeenCalledWith('user:uuid-1:refresh:family-1');
    });

    it('should invalidate all sessions on token reuse (no stored token)', async () => {
      jwtService.verify.mockReturnValue(mockPayload);
      redisService.get.mockResolvedValue(null); // token not in whitelist

      await expect(service.refresh('reused-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(redisService.keys).toHaveBeenCalledWith('user:uuid-1:refresh:*');
    });

    it('should throw UnauthorizedException on invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(service.refresh('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should blacklist access token and invalidate all refresh tokens', async () => {
      jwtService.decode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });

      await service.logout('uuid-1', 'access-token-string');

      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining('blacklist:at:'),
        '1',
        expect.any(Number),
      );
      expect(redisService.keys).toHaveBeenCalledWith('user:uuid-1:refresh:*');
    });

    it('should not blacklist if token has no exp', async () => {
      jwtService.decode.mockReturnValue({});

      await service.logout('uuid-1', 'token');

      // Should not call set for blacklist
      expect(redisService.set).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should change password and invalidate all sessions', async () => {
      employeesService.findByIdWithPassword.mockResolvedValue(mockEmployee);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      await service.changePassword('uuid-1', 'oldPass', 'newPass');

      expect(employeesService.updatePassword).toHaveBeenCalledWith('uuid-1', 'new-hashed-password');
      expect(redisService.keys).toHaveBeenCalledWith('user:uuid-1:refresh:*');
    });

    it('should throw when current password is incorrect', async () => {
      employeesService.findByIdWithPassword.mockResolvedValue(mockEmployee);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('uuid-1', 'wrongPass', 'newPass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when employee not found', async () => {
      employeesService.findByIdWithPassword.mockResolvedValue(null);

      await expect(
        service.changePassword('nonexist', 'old', 'new'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('isAccessTokenBlacklisted', () => {
    it('should return true when token is blacklisted', async () => {
      redisService.get.mockResolvedValue('1');

      const result = await service.isAccessTokenBlacklisted('some-token');

      expect(result).toBe(true);
    });

    it('should return false when token is not blacklisted', async () => {
      redisService.get.mockResolvedValue(null);

      const result = await service.isAccessTokenBlacklisted('some-token');

      expect(result).toBe(false);
    });
  });
});
