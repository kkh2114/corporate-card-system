import { IsNumber, IsOptional, IsString, IsBoolean, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GpsDto {
  @ApiProperty({ description: '위도 (-90 ~ 90)', example: 37.5665 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: '경도 (-180 ~ 180)', example: 126.978 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ description: '정확도 (미터)', example: 15.5 })
  @IsNumber()
  accuracy: number;

  @ApiProperty({ description: 'GPS 수집 시각 (ISO 8601)', example: '2026-03-08T14:23:00.000Z' })
  @IsDateString()
  timestamp: string;
}

export class ReceiptMetadataDto {
  @ApiPropertyOptional({ description: '메모 (최대 500자)', example: '팀 회식 비용' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: '배달 주문 여부', example: false })
  @IsOptional()
  @IsBoolean()
  isDelivery?: boolean;

  @ApiPropertyOptional({ description: '온라인 결제 여부', example: false })
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;
}

export class UploadReceiptDto {
  @ApiProperty({ description: 'GPS 위치 정보 (JSON)', type: GpsDto })
  @ValidateNested()
  @Type(() => GpsDto)
  gps: GpsDto;

  @ApiPropertyOptional({ description: '추가 메타데이터 (JSON)', type: ReceiptMetadataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReceiptMetadataDto)
  metadata?: ReceiptMetadataDto;
}
