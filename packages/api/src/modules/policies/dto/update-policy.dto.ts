import { IsNumber, IsOptional, IsArray, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePolicyDto {
  @ApiPropertyOptional({ description: '월간 한도 (원)', example: 3000000 })
  @IsOptional()
  @IsNumber()
  monthlyLimit?: number;

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

  @ApiPropertyOptional({ description: '정책 만료일 (ISO 8601, null이면 무기한)', example: '2026-12-31T23:59:59.000Z', nullable: true })
  @IsOptional()
  @IsDateString()
  validUntil?: string | null;
}
