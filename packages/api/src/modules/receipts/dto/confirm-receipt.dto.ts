import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReceiptItemDto {
  @ApiProperty({ description: '품목명' })
  @IsString()
  name: string;

  @ApiProperty({ description: '수량' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: '가격' })
  @IsNumber()
  price: number;
}

export class ConfirmReceiptDto {
  @ApiProperty({ description: '영수증 ID' })
  @IsString()
  receiptId: string;

  @ApiProperty({ description: '상호명' })
  @IsString()
  merchantName: string;

  @ApiPropertyOptional({ description: '사업자번호' })
  @IsOptional()
  @IsString()
  businessNumber?: string;

  @ApiPropertyOptional({ description: '주소' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: '금액' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: '부가세' })
  @IsOptional()
  @IsNumber()
  vat?: number;

  @ApiProperty({ description: '카테고리' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ description: '거래일시' })
  @IsOptional()
  @IsString()
  transactionDate?: string;

  @ApiPropertyOptional({ description: '품목 목록', type: [ReceiptItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiptItemDto)
  items?: ReceiptItemDto[];
}
