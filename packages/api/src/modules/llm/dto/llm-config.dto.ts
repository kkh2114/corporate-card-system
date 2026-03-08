import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LlmProviderType {
  ANTHROPIC = 'anthropic',
  OPENAI = 'openai',
  GOOGLE = 'google',
  CUSTOM = 'custom',
}

export class UpdateLlmConfigDto {
  @ApiProperty({ description: 'LLM 프로바이더', enum: LlmProviderType, example: 'anthropic' })
  @IsEnum(LlmProviderType)
  provider: LlmProviderType;

  @ApiProperty({ description: 'API 키', example: 'sk-...' })
  @IsString()
  apiKey: string;

  @ApiPropertyOptional({ description: '사용할 모델', example: 'claude-sonnet-4-20250514' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: '커스텀 프로바이더 엔드포인트 URL' })
  @IsOptional()
  @IsString()
  endpoint?: string;
}

export class LlmProviderInfoDto {
  @ApiProperty({ description: '프로바이더 이름' })
  name: string;

  @ApiProperty({ description: '표시 이름' })
  displayName: string;

  @ApiProperty({ description: '기본 모델' })
  defaultModel: string;

  @ApiProperty({ description: '커스텀 엔드포인트 필요 여부' })
  requiresEndpoint: boolean;
}

export class LlmCurrentConfigDto {
  @ApiProperty({ description: '현재 프로바이더', nullable: true })
  provider: string | null;

  @ApiProperty({ description: '현재 모델', nullable: true })
  model: string | null;

  @ApiProperty({ description: '설정 여부' })
  configured: boolean;
}
