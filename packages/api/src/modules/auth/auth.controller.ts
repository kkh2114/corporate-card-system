import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '@/common/decorators/public.decorator';
import { Audit } from '@/common/decorators/audit.decorator';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인', description: '사번과 비밀번호로 로그인하여 JWT 토큰을 발급받습니다.' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: '로그인 성공. accessToken, refreshToken, 사용자 정보 반환' })
  @ApiResponse({ status: 401, description: '사번 또는 비밀번호 불일치' })
  @Audit({ action: 'LOGIN', category: 'AUTH', description: '사용자 로그인' })
  login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '토큰 갱신', description: 'Refresh Token으로 새로운 Access Token을 발급합니다. Refresh Token Rotation 적용.' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '토큰 갱신 성공. 새로운 accessToken 반환' })
  @ApiResponse({ status: 401, description: 'Refresh Token이 유효하지 않거나 만료됨' })
  refresh(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Refresh token이 필요합니다.');
    }
    return this.authService.refresh(token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그아웃', description: '현재 세션을 종료하고 토큰을 무효화합니다.' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  @Audit({ action: 'LOGOUT', category: 'AUTH', description: '사용자 로그아웃' })
  async logout(
    @Request() req: any,
    @Headers('authorization') auth: string,
  ) {
    const token = auth?.replace('Bearer ', '') || '';
    await this.authService.logout(req.user.id, token);
    return { message: '로그아웃 되었습니다.' };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '비밀번호 변경', description: '현재 비밀번호를 확인한 후 새 비밀번호로 변경합니다.' })
  @ApiResponse({ status: 200, description: '비밀번호 변경 성공' })
  @ApiResponse({ status: 400, description: '비밀번호 형식이 올바르지 않음' })
  @ApiResponse({ status: 401, description: '현재 비밀번호 불일치' })
  @Audit({
    action: 'CHANGE_PASSWORD',
    category: 'AUTH',
    severity: 'WARNING',
    description: '비밀번호 변경',
  })
  async changePassword(
    @Request() req: any,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
    );
    return { message: '비밀번호가 변경되었습니다. 다시 로그인하세요.' };
  }
}
