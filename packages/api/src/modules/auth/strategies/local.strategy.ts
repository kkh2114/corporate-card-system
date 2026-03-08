import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'employeeId' });
  }

  async validate(employeeId: string, password: string) {
    const user = await this.authService.validateUser(employeeId, password);
    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_001',
        message: '사번 또는 비밀번호가 일치하지 않습니다.',
      });
    }
    return user;
  }
}
