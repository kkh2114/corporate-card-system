import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { createHash } from 'crypto';
import { RedisService } from '../../redis/redis.service';

export interface JwtPayload {
  sub: string;
  employeeId: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtPayload) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (token) {
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const blacklisted = await this.redisService.get(`blacklist:at:${tokenHash}`);
      if (blacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }
    return {
      id: payload.sub,
      employeeId: payload.employeeId,
      role: payload.role,
    };
  }
}
