import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: '사번', example: 'EMP001' })
  @IsString()
  employeeId: string;

  @ApiProperty({ description: '비밀번호 (8자 이상)', example: 'Password1!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
