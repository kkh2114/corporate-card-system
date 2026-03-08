import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StatisticsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class StatisticsOverviewQueryDto {
  @ApiProperty({ description: '통계 기간 단위', enum: StatisticsPeriod, example: StatisticsPeriod.MONTHLY })
  @IsEnum(StatisticsPeriod)
  period: StatisticsPeriod;

  @ApiPropertyOptional({ description: '조회 시작일 (ISO 8601)', example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '조회 종료일 (ISO 8601)', example: '2026-03-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
