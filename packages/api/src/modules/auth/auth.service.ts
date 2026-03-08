import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { EmployeesService } from '../employees/employees.service';
import { Employee } from '../employees/entities/employee.entity';
import { TokenResponseDto } from './dto/token.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { RedisService } from '../redis/redis.service';

const BCRYPT_SALT_ROUNDS = 12;
const MAX_SESSIONS = 5;
const LOGIN_FAIL_LIMIT = 5;
const LOGIN_LOCK_DURATION = 1800; // 30 minutes
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly employeesService: EmployeesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async validateUser(employeeId: string, password: string): Promise<Employee | null> {
    // Check account lock
    const isLocked = await this.redisService.get(`login:locked:${employeeId}`);
    if (isLocked) {
      throw new ForbiddenException(
        '계정이 잠겼습니다. 30분 후 다시 시도하거나 관리자에게 문의하세요.',
      );
    }

    const employee = await this.employeesService.findByEmployeeIdWithPassword(employeeId);
    if (employee && (await bcrypt.compare(password, employee.password))) {
      // Reset fail counter on success
      await this.redisService.del(`login:fail:${employeeId}`);
      return employee;
    }

    await this.handleLoginFailure(employeeId);
    return null;
  }

  async login(employee: Employee): Promise<TokenResponseDto> {
    const tokenFamily = randomUUID();
    const payload: JwtPayload = {
      sub: employee.id,
      employeeId: employee.employeeId,
      role: employee.role,
    };

    const expiresIn = Number(this.configService.get('JWT_ACCESS_EXPIRATION', '3600'));

    const accessToken = this.jwtService.sign(payload, { expiresIn });
    const refreshToken = this.jwtService.sign(
      { ...payload, tokenFamily },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: Number(this.configService.get('JWT_REFRESH_EXPIRATION', '604800')),
      },
    );

    // Store refresh token in Redis whitelist
    await this.storeRefreshToken(employee.id, tokenFamily, refreshToken);
    this.logger.log(`Login success: ${employee.employeeId}`);

    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        id: employee.id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        role: employee.role,
      },
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    try {
      const payload = this.jwtService.verify<JwtPayload & { tokenFamily: string }>(
        refreshToken,
        { secret: this.configService.get<string>('JWT_REFRESH_SECRET') },
      );

      const { sub: userId, tokenFamily } = payload;

      // Check whitelist (Refresh Token Rotation)
      const storedToken = await this.redisService.get(
        `user:${userId}:refresh:${tokenFamily}`,
      );
      if (!storedToken) {
        // Token reuse detected - invalidate all sessions
        this.logger.warn(`Refresh token reuse detected for user: ${userId}`);
        await this.invalidateAllSessions(userId);
        throw new UnauthorizedException('보안 위협이 감지되었습니다. 다시 로그인하세요.');
      }

      // Delete used refresh token
      await this.redisService.del(`user:${userId}:refresh:${tokenFamily}`);

      // Issue new token pair with new family
      const newTokenFamily = randomUUID();
      const expiresIn = Number(this.configService.get('JWT_ACCESS_EXPIRATION', '3600'));
      const newAccessToken = this.jwtService.sign(
        { sub: payload.sub, employeeId: payload.employeeId, role: payload.role },
        { expiresIn },
      );
      const newRefreshToken = this.jwtService.sign(
        { sub: payload.sub, employeeId: payload.employeeId, role: payload.role, tokenFamily: newTokenFamily },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: Number(this.configService.get('JWT_REFRESH_EXPIRATION', '604800')),
        },
      );

      await this.storeRefreshToken(userId, newTokenFamily, newRefreshToken);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }

  async logout(userId: string, accessToken: string): Promise<void> {
    // Blacklist current access token for remaining TTL
    try {
      const decoded = this.jwtService.decode(accessToken) as { exp?: number };
      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          const tokenHash = createHash('sha256').update(accessToken).digest('hex');
          await this.redisService.set(`blacklist:at:${tokenHash}`, '1', ttl);
        }
      }
    } catch {
      // Ignore decode errors
    }

    // Remove all refresh tokens
    await this.invalidateAllSessions(userId);
    this.logger.log(`Logout: user ${userId}`);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const employee = await this.employeesService.findByIdWithPassword(userId);
    if (!employee) {
      throw new UnauthorizedException();
    }

    const isValid = await bcrypt.compare(currentPassword, employee.password);
    if (!isValid) {
      throw new UnauthorizedException('현재 비밀번호가 일치하지 않습니다.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await this.employeesService.updatePassword(userId, hashedPassword);

    // Force logout all sessions
    await this.invalidateAllSessions(userId);
  }

  async isAccessTokenBlacklisted(token: string): Promise<boolean> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const result = await this.redisService.get(`blacklist:at:${tokenHash}`);
    return !!result;
  }

  // --- Private helpers ---

  private async storeRefreshToken(userId: string, tokenFamily: string, token: string): Promise<void> {
    // Enforce max sessions
    const keys = await this.redisService.keys(`user:${userId}:refresh:*`);
    if (keys.length >= MAX_SESSIONS) {
      await this.redisService.del(keys[0]);
    }
    await this.redisService.set(
      `user:${userId}:refresh:${tokenFamily}`,
      token,
      REFRESH_TOKEN_TTL,
    );
  }

  private async invalidateAllSessions(userId: string): Promise<void> {
    const keys = await this.redisService.keys(`user:${userId}:refresh:*`);
    await Promise.all(keys.map((key) => this.redisService.del(key)));
  }

  private async handleLoginFailure(employeeId: string): Promise<void> {
    const key = `login:fail:${employeeId}`;
    const failCount = await this.redisService.incr(key);
    await this.redisService.expire(key, LOGIN_LOCK_DURATION);

    if (failCount >= LOGIN_FAIL_LIMIT) {
      await this.redisService.set(
        `login:locked:${employeeId}`,
        '1',
        LOGIN_LOCK_DURATION,
      );
      this.logger.warn(`Account locked: ${employeeId} (${failCount} failed attempts)`);
    }
  }
}
