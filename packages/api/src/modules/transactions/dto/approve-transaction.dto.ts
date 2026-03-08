import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveTransactionDto {
  @ApiPropertyOptional({ description: '승인 메모', example: '확인 완료' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class RejectTransactionDto {
  @ApiProperty({ description: '반려 사유', example: '영수증 금액 불일치' })
  @IsString()
  reason: string;
}
