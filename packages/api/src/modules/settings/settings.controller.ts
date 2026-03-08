import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { TestConnectionDto } from './dto/test-connection.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { EmployeeRole } from '@/modules/employees/entities/employee.entity';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('setup-required')
  @Roles(EmployeeRole.ADMIN)
  @ApiOperation({ summary: '초기 설정 필요 여부 확인', description: '필수 설정이 없으면 true를 반환합니다.' })
  @ApiResponse({ status: 200, description: '초기 설정 필요 여부' })
  async getSetupRequired() {
    const required = await this.settingsService.isSetupRequired();
    return { setupRequired: required };
  }

  @Get('status')
  @Roles(EmployeeRole.ADMIN)
  @ApiOperation({ summary: '전체 연결 상태 조회', description: '모든 외부 서비스의 설정 및 연결 상태를 반환합니다.' })
  @ApiResponse({ status: 200, description: '전체 연결 상태' })
  async getStatus() {
    return this.settingsService.getStatus();
  }

  @Get(':category')
  @Roles(EmployeeRole.ADMIN)
  @ApiOperation({ summary: '카테고리별 설정 조회', description: '지정한 카테고리의 설정값을 조회합니다. 암호화된 값은 복호화하여 반환합니다.' })
  @ApiParam({ name: 'category', description: '설정 카테고리', enum: ['database', 'redis', 's3', 'ocr', 'llm'] })
  @ApiResponse({ status: 200, description: '카테고리별 설정 목록' })
  async getByCategory(@Param('category') category: string) {
    return this.settingsService.getByCategory(category);
  }

  @Put(':category')
  @Roles(EmployeeRole.ADMIN)
  @ApiOperation({ summary: '카테고리별 설정 저장', description: '지정한 카테고리의 설정값을 일괄 저장합니다.' })
  @ApiParam({ name: 'category', description: '설정 카테고리', enum: ['database', 'redis', 's3', 'ocr', 'llm'] })
  @ApiResponse({ status: 200, description: '설정 저장 완료' })
  async updateByCategory(
    @Param('category') category: string,
    @Body() dto: UpdateSettingsDto,
    @Request() req: any,
  ) {
    await this.settingsService.bulkUpsert(category, dto.settings, req.user.id);
    return { message: `${category} 설정이 저장되었습니다.` };
  }

  @Post('test-connection')
  @Roles(EmployeeRole.ADMIN)
  @ApiOperation({ summary: '연결 테스트', description: '지정한 카테고리의 연결을 테스트합니다.' })
  @ApiResponse({ status: 200, description: '연결 테스트 결과' })
  async testConnection(@Body() dto: TestConnectionDto) {
    const config: Record<string, any> = { ...dto };
    delete config.category;
    return this.settingsService.testConnection(dto.category, config);
  }
}
