import { ApiProperty } from '@nestjs/swagger';

class UserInfo {
  @ApiProperty({ description: '사용자 UUID' })
  id: string;

  @ApiProperty({ description: '사번', example: 'EMP001' })
  employeeId: string;

  @ApiProperty({ description: '이름', example: '김민수' })
  name: string;

  @ApiProperty({ description: '이메일', example: 'minsu@corp.com' })
  email: string;

  @ApiProperty({ description: '부서', example: '개발팀' })
  department: string;

  @ApiProperty({ description: '역할', enum: ['employee', 'manager', 'finance', 'admin', 'auditor'] })
  role: string;
}

export class TokenResponseDto {
  @ApiProperty({ description: 'JWT Access Token' })
  accessToken: string;

  @ApiProperty({ description: 'JWT Refresh Token' })
  refreshToken: string;

  @ApiProperty({ description: '토큰 만료 시간 (초)', example: 3600 })
  expiresIn: number;

  @ApiProperty({ description: '사용자 정보', type: UserInfo })
  user: UserInfo;
}
