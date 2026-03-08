import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../src/modules/auth/auth.service';
import { EmployeesService } from '../../src/modules/employees/employees.service';
import { RedisService } from '../../src/modules/redis/redis.service';
import { EmployeeRole } from '../../src/modules/employees/entities/employee.entity';

describe('AuthService', () => {
  let authService: AuthService;
  let employeesService: jest.Mocked<EmployeesService>;
  let jwtService: jest.Mocked<JwtService>;
  let redisService: jest.Mocked<RedisService>;
  let configService: jest.Mocked<ConfigService>;

  const mockEmployee = {
    id: 'user-uuid-1',
    employeeId: 'EMP-2024-001',
    password: '', // will be set in beforeEach
    name: '김민수',
    email: 'minsu@company.com',
    department: '영업팀',
    role: EmployeeRole.EMPLOYEE,
  } as any;

  beforeEach(async () => {
    mockEmployee.password = await bcrypt.hash('ValidPass1!', 12);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: EmployeesService,
          useValue: {
            findByEmployeeIdWithPassword: jest.fn(),
            findByIdWithPassword: jest.fn(),
            updatePassword: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
            verify: jest.fn(),
            decode: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultVal?: any) => {
              const config: Record<string, any> = {
                JWT_SECRET: 'test-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_ACCESS_EXPIRATION: 3600,
                JWT_REFRESH_EXPIRATION: 604800,
              };
              return config[key] ?? defaultVal;
            }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
            incr: jest.fn().mockResolvedValue(1),
            expire: jest.fn().mockResolvedValue(undefined),
            keys: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    employeesService = module.get(EmployeesService);
    jwtService = module.get(JwtService);
    redisService = module.get(RedisService);
    configService = module.get(ConfigService);
  });

  describe('validateUser', () => {
    it('should return employee on valid credentials', async () => {
      employeesService.findByEmployeeIdWithPassword.mockResolvedValue(mockEmployee);
      const result = await authService.validateUser('EMP-2024-001', 'ValidPass1!');
      expect(result).toEqual(mockEmployee);
      expect(redisService.del).toHaveBeenCalledWith('login:fail:EMP-2024-001');
    });

    it('should return null and increment fail counter on wrong password', async () => {
      employeesService.findByEmployeeIdWithPassword.mockResolvedValue(mockEmployee);
      const result = await authService.validateUser('EMP-2024-001', 'WrongPass1!');
      expect(result).toBeNull();
      expect(redisService.incr).toHaveBeenCalledWith('login:fail:EMP-2024-001');
    });

    it('should return null when employee not found', async () => {
      employeesService.findByEmployeeIdWithPassword.mockResolvedValue(null);
      const result = await authService.validateUser('NONEXIST', 'AnyPass1!');
      expect(result).toBeNull();
      expect(redisService.incr).toHaveBeenCalledWith('login:fail:NONEXIST');
    });

    it('should throw ForbiddenException when account is locked', async () => {
      redisService.get.mockResolvedValue('1'); // locked
      await expect(
        authService.validateUser('EMP-2024-001', 'ValidPass1!'),
      ).rejects.toThrow(ForbiddenException);
      // Should not even check password
      expect(employeesService.findByEmployeeIdWithPassword).not.toHaveBeenCalled();
    });
  });

  describe('login failure lockout', () => {
    it('should lock account after 5 failed attempts', async () => {
      employeesService.findByEmployeeIdWithPassword.mockResolvedValue(mockEmployee);
      redisService.incr.mockResolvedValue(5);

      await authService.validateUser('EMP-2024-001', 'WrongPass1!');

      expect(redisService.set).toHaveBeenCalledWith(
        'login:locked:EMP-2024-001',
        '1',
        1800,
      );
    });

    it('should not lock account on 4th failure', async () => {
      employeesService.findByEmployeeIdWithPassword.mockResolvedValue(mockEmployee);
      redisService.incr.mockResolvedValue(4);

      await authService.validateUser('EMP-2024-001', 'WrongPass1!');

      expect(redisService.set).not.toHaveBeenCalledWith(
        'login:locked:EMP-2024-001',
        '1',
        1800,
      );
    });
  });

  describe('login', () => {
    it('should return tokens and user info', async () => {
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await authService.login(mockEmployee);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.expiresIn).toBe(3600);
      expect(result.user.employeeId).toBe('EMP-2024-001');
      expect(result.user.role).toBe(EmployeeRole.EMPLOYEE);
    });

    it('should store refresh token in Redis', async () => {
      await authService.login(mockEmployee);
      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringMatching(/^user:user-uuid-1:refresh:/),
        expect.any(String),
        604800,
      );
    });

    it('should evict oldest session when max sessions exceeded', async () => {
      redisService.keys.mockResolvedValue([
        'user:user-uuid-1:refresh:a',
        'user:user-uuid-1:refresh:b',
        'user:user-uuid-1:refresh:c',
        'user:user-uuid-1:refresh:d',
        'user:user-uuid-1:refresh:e',
      ]);

      await authService.login(mockEmployee);

      // Should delete the oldest key
      expect(redisService.del).toHaveBeenCalledWith('user:user-uuid-1:refresh:a');
    });
  });

  describe('refresh (Token Rotation)', () => {
    it('should issue new token pair on valid refresh', async () => {
      jwtService.verify.mockReturnValue({
        sub: 'user-uuid-1',
        employeeId: 'EMP-2024-001',
        role: EmployeeRole.EMPLOYEE,
        tokenFamily: 'family-1',
      });
      redisService.get.mockResolvedValue('stored-refresh-token');
      jwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await authService.refresh('old-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      // Old token should be deleted
      expect(redisService.del).toHaveBeenCalledWith('user:user-uuid-1:refresh:family-1');
      // New token should be stored
      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringMatching(/^user:user-uuid-1:refresh:/),
        'new-refresh-token',
        604800,
      );
    });

    it('should invalidate all sessions on token reuse detection', async () => {
      jwtService.verify.mockReturnValue({
        sub: 'user-uuid-1',
        employeeId: 'EMP-2024-001',
        role: EmployeeRole.EMPLOYEE,
        tokenFamily: 'family-1',
      });
      // Token not in whitelist = reuse detected
      redisService.get.mockResolvedValue(null);
      redisService.keys.mockResolvedValue([
        'user:user-uuid-1:refresh:family-2',
        'user:user-uuid-1:refresh:family-3',
      ]);

      await expect(authService.refresh('reused-token')).rejects.toThrow(
        UnauthorizedException,
      );

      // All sessions should be invalidated
      expect(redisService.del).toHaveBeenCalledWith('user:user-uuid-1:refresh:family-2');
      expect(redisService.del).toHaveBeenCalledWith('user:user-uuid-1:refresh:family-3');
    });

    it('should throw on expired/invalid refresh token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(authService.refresh('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should blacklist access token and clear sessions', async () => {
      jwtService.decode.mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 600, // 10 min remaining
      });
      redisService.keys.mockResolvedValue(['user:user-uuid-1:refresh:fam1']);

      await authService.logout('user-uuid-1', 'some-access-token');

      // Access token blacklisted
      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringMatching(/^blacklist:at:/),
        '1',
        expect.any(Number),
      );
      // Refresh tokens cleared
      expect(redisService.del).toHaveBeenCalledWith('user:user-uuid-1:refresh:fam1');
    });

    it('should handle token decode failure gracefully', async () => {
      jwtService.decode.mockReturnValue(null);
      redisService.keys.mockResolvedValue([]);

      // Should not throw
      await expect(
        authService.logout('user-uuid-1', 'malformed-token'),
      ).resolves.not.toThrow();
    });
  });

  describe('isAccessTokenBlacklisted', () => {
    it('should return true for blacklisted token', async () => {
      redisService.get.mockResolvedValue('1');
      const result = await authService.isAccessTokenBlacklisted('blacklisted-token');
      expect(result).toBe(true);
    });

    it('should return false for valid token', async () => {
      redisService.get.mockResolvedValue(null);
      const result = await authService.isAccessTokenBlacklisted('valid-token');
      expect(result).toBe(false);
    });
  });

  describe('changePassword', () => {
    it('should change password and invalidate all sessions', async () => {
      const empWithPwd = { ...mockEmployee };
      employeesService.findByIdWithPassword.mockResolvedValue(empWithPwd);
      redisService.keys.mockResolvedValue(['user:user-uuid-1:refresh:fam1']);

      await authService.changePassword('user-uuid-1', 'ValidPass1!', 'NewValid1!');

      expect(employeesService.updatePassword).toHaveBeenCalledWith(
        'user-uuid-1',
        expect.any(String), // hashed password
      );
      // All sessions invalidated
      expect(redisService.del).toHaveBeenCalledWith('user:user-uuid-1:refresh:fam1');
    });

    it('should throw on wrong current password', async () => {
      const empWithPwd = { ...mockEmployee };
      employeesService.findByIdWithPassword.mockResolvedValue(empWithPwd);

      await expect(
        authService.changePassword('user-uuid-1', 'WrongCurrent!1', 'NewValid1!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when user not found', async () => {
      employeesService.findByIdWithPassword.mockResolvedValue(null);

      await expect(
        authService.changePassword('nonexistent', 'Any1!pass', 'New1!pass'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
