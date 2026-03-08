import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LlmProviderType } from './llm-config.dto';

export class TestConnectionDto {
  @ApiProperty({ description: 'LLM 프로바이더', enum: LlmProviderType })
  @IsEnum(LlmProviderType)
  provider: LlmProviderType;

  @ApiProperty({ description: 'API 키' })
  @IsString()
  apiKey: string;

  @ApiPropertyOptional({ description: '테스트할 모델' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: '커스텀 엔드포인트 URL' })
  @IsOptional()
  @IsString()
  endpoint?: string;
}

export class ListModelsDto {
  @ApiProperty({ description: 'LLM 프로바이더', enum: LlmProviderType })
  @IsEnum(LlmProviderType)
  provider: LlmProviderType;

  @ApiProperty({ description: 'API 키' })
  @IsString()
  apiKey: string;

  @ApiPropertyOptional({ description: '커스텀 엔드포인트 URL' })
  @IsOptional()
  @IsString()
  endpoint?: string;
}
