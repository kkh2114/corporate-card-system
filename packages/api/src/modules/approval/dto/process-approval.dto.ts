import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ApprovalAction {
  APPROVE = 'approve',
  REJECT = 'reject',
}

export class ProcessApprovalDto {
  @ApiProperty({ description: '승인/거절', enum: ApprovalAction })
  @IsEnum(ApprovalAction)
  action: ApprovalAction;

  @ApiProperty({ description: '코멘트', required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}
