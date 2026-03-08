import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SettingItemDto {
  @ApiProperty({ description: '설정 키', example: 'host' })
  @IsString()
  key: string;

  @ApiProperty({ description: '설정 값', example: 'localhost' })
  @IsString()
  value: string;

  @ApiProperty({ description: '암호화 여부', example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isEncrypted?: boolean;
}

export class UpdateSettingsDto {
  @ApiProperty({ description: '설정 항목 목록', type: [SettingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettingItemDto)
  settings: SettingItemDto[];
}
