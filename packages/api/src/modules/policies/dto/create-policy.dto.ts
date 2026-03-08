import { IsString, IsNumber, IsOptional, IsArray, IsBoolean, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePolicyDto {
  @ApiProperty({ description: '직원 UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  employeeId: string;

  @ApiPropertyOptional({ description: '카드 번호', example: '9410-1234-5678-0001' })
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @ApiProperty({ description: '월간 한도 (원)', example: 3000000 })
  @IsNumber()
  monthlyLimit: number;

  @ApiPropertyOptional({ description: '일간 한도 (원)', example: 500000 })
  @IsOptional()
  @IsNumber()
  dailyLimit?: number;

  @ApiPropertyOptional({ description: '건당 한도 (원)', example: 200000 })
  @IsOptional()
  @IsNumber()
  perTransactionLimit?: number;

  @ApiPropertyOptional({ description: '허용 카테고리 목록', example: ['식비', '교통비', '사무용품'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedCategories?: string[];

  @ApiPropertyOptional({ description: '허용 지역 목록', example: ['서울', '경기'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedRegions?: string[];

  @ApiPropertyOptional({ description: '제한 구역 목록', example: ['유흥업소', '도박장'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  restrictedAreas?: string[];

  @ApiProperty({ description: '정책 시작일 (ISO 8601)', example: '2026-01-01T00:00:00.000Z' })
  @IsDateString()
  validFrom: string;

  @ApiPropertyOptional({ description: '정책 만료일 (ISO 8601)', example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ description: '활성화 여부', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
