import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { EmployeeRole } from '../employees/entities/employee.entity';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('realtime')
  @UseGuards(RolesGuard)
  @Roles(EmployeeRole.ADMIN, EmployeeRole.FINANCE, EmployeeRole.MANAGER)
  @ApiOperation({
    summary: '실시간 대시보드 데이터',
    description: '금일 총 사용액, 최근 거래, 이상 거래 알림, 부서별 현황 등 실시간 대시보드 데이터를 반환합니다.',
  })
  @ApiResponse({ status: 200, description: '실시간 대시보드 데이터 반환' })
  @ApiResponse({ status: 403, description: '권한 부족' })
  getRealtime() {
    return this.dashboardService.getRealtime();
  }
}
