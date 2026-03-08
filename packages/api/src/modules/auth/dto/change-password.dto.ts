import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: '현재 비밀번호' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: '새 비밀번호 (8자 이상, 대소문자+숫자+특수문자)' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/,
    { message: '비밀번호는 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.' },
  )
  newPassword: string;
}
