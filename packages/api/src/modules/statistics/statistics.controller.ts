import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { StatisticsOverviewQueryDto } from './dto/statistics-query.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { EmployeeRole } from '../employees/entities/employee.entity';

@ApiTags('Statistics')
@ApiBearerAuth()
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  @UseGuards(RolesGuard)
  @Roles(EmployeeRole.ADMIN, EmployeeRole.FINANCE, EmployeeRole.MANAGER)
  @ApiOperation({
    summary: '통계 개요 조회',
    description: '기간별 카드 사용 통계를 조회합니다. 총 사용액, 승인률, 부서별 분석 등. 관리자/재무/매니저 권한 필요.',
  })
  @ApiResponse({ status: 200, description: '통계 데이터 반환 (기간별 사용액, 승인률, 위반 건수 등)' })
  @ApiResponse({ status: 403, description: '권한 부족' })
  getOverview(@Query() query: StatisticsOverviewQueryDto) {
    return this.statisticsService.getOverview(query);
  }
}
