import { IsOptional, IsEnum, IsDateString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { TransactionStatus } from '../entities/transaction.entity';

export class GetTransactionsDto extends PaginationDto {
  @ApiPropertyOptional({ description: '거래 상태 필터', enum: TransactionStatus })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({ description: '조회 시작일 (ISO 8601)', example: '2026-03-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '조회 종료일 (ISO 8601)', example: '2026-03-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: '직원 ID 필터', example: 'uuid-string' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ description: '부서 ID 필터', example: 'uuid-string' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: '정렬 기준', enum: ['transactionDate', 'amount'] })
  @IsOptional()
  @IsString()
  sortBy?: 'transactionDate' | 'amount';

  @ApiPropertyOptional({ description: '정렬 순서', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
