import { IsString, IsEmail, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeRole } from '../entities/employee.entity';

export class CreateEmployeeDto {
  @ApiProperty({ description: '사번 (최대 20자)', example: 'EMP001' })
  @IsString()
  @MaxLength(20)
  employeeId: string;

  @ApiProperty({ description: '이름', example: '김민수' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '이메일', example: 'minsu@corp.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '비밀번호 (8자 이상)', example: 'Password1!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ description: '부서', example: '개발팀' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional({ description: '직급', example: '선임' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiPropertyOptional({ description: '연락처', example: '010-1234-5678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: '역할', enum: EmployeeRole, default: EmployeeRole.EMPLOYEE })
  @IsOptional()
  @IsEnum(EmployeeRole)
  role?: EmployeeRole;
}
