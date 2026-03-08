import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles } from '@/common/decorators/roles.decorator';
import { EmployeeRole } from '@/modules/employees/entities/employee.entity';
import { LlmService } from './llm.service';
import { UpdateLlmConfigDto, LlmProviderInfoDto, LlmCurrentConfigDto } from './dto/llm-config.dto';
import { TestConnectionDto, ListModelsDto } from './dto/llm-request.dto';

@ApiTags('LLM')
@ApiBearerAuth()
@Controller('llm')
@Roles(EmployeeRole.ADMIN)
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Get('providers')
  @ApiOperation({ summary: '사용 가능한 LLM 프로바이더 목록', description: '지원하는 LLM 프로바이더 목록을 반환합니다.' })
  @ApiResponse({ status: 200, description: '프로바이더 목록', type: [LlmProviderInfoDto] })
  getProviders() {
    return this.llmService.getAvailableProviders();
  }

  @Get('current')
  @ApiOperation({ summary: '현재 활성 LLM 프로바이더', description: '현재 설정된 LLM 프로바이더 정보를 반환합니다.' })
  @ApiResponse({ status: 200, description: '현재 설정', type: LlmCurrentConfigDto })
  getCurrentConfig() {
    return this.llmService.getCurrentConfig();
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'LLM 연결 테스트', description: '지정된 프로바이더와 API 키로 연결 테스트를 수행합니다.' })
  @ApiResponse({ status: 200, description: '테스트 결과' })
  async testConnection(@Body() dto: TestConnectionDto) {
    return this.llmService.testConnection(dto.provider, dto.apiKey, dto.model, dto.endpoint);
  }

  @Post('models')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '모델 목록 조회', description: '지정된 프로바이더에서 사용 가능한 모델 목록을 조회합니다.' })
  @ApiResponse({ status: 200, description: '모델 목록' })
  async listModels(@Body() dto: ListModelsDto) {
    const models = await this.llmService.listModels(dto.provider, dto.apiKey, dto.endpoint);
    return { models };
  }

  @Put('config')
  @ApiOperation({ summary: 'LLM 프로바이더 설정 변경', description: '활성 LLM 프로바이더를 변경합니다.' })
  @ApiResponse({ status: 200, description: '설정 변경 완료' })
  updateConfig(@Body() dto: UpdateLlmConfigDto) {
    this.llmService.setProvider({
      provider: dto.provider,
      apiKey: dto.apiKey,
      model: dto.model,
      endpoint: dto.endpoint,
    });
    return { message: 'LLM 프로바이더 설정이 변경되었습니다.' };
  }
}
