import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TestConnectionDto {
  @ApiProperty({
    description: '연결 테스트할 카테고리',
    example: 'database',
    enum: ['database', 'redis', 's3', 'ocr', 'llm'],
  })
  @IsString()
  category: string;

  @ApiProperty({ description: '호스트', example: 'localhost', required: false })
  @IsString()
  @IsOptional()
  host?: string;

  @ApiProperty({ description: '포트', example: 5432, required: false })
  @IsNumber()
  @IsOptional()
  port?: number;

  @ApiProperty({ description: '사용자명', required: false })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ description: '비밀번호', required: false })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ description: '데이터베이스명', required: false })
  @IsString()
  @IsOptional()
  database?: string;

  @ApiProperty({ description: 'API 키', required: false })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiProperty({ description: 'API 엔드포인트', required: false })
  @IsString()
  @IsOptional()
  endpoint?: string;

  @ApiProperty({ description: '프로바이더', required: false })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiProperty({ description: '리전', required: false })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiProperty({ description: '버킷명', required: false })
  @IsString()
  @IsOptional()
  bucket?: string;

  @ApiProperty({ description: 'Access Key ID', required: false })
  @IsString()
  @IsOptional()
  accessKeyId?: string;

  @ApiProperty({ description: 'Secret Access Key', required: false })
  @IsString()
  @IsOptional()
  secretAccessKey?: string;
}
