import { IsUUID, IsEnum, IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApprovalTrigger } from '../entities/approval-request.entity';

export class CreateApprovalDto {
  @ApiProperty({ description: '거래 ID' })
  @IsUUID()
  transactionId: string;

  @ApiProperty({ description: '승인 트리거', enum: ApprovalTrigger })
  @IsEnum(ApprovalTrigger)
  trigger: ApprovalTrigger;

  @ApiProperty({ description: '요청 금액' })
  @IsNumber()
  requestedAmount: number;

  @ApiProperty({ description: '초과 금액', required: false })
  @IsOptional()
  @IsNumber()
  exceededAmount?: number;

  @ApiProperty({ description: '요청 사유', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
