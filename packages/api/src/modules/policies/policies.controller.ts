import { Controller, Get, Post, Put, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PoliciesService } from './policies.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { EmployeeRole } from '../employees/entities/employee.entity';

@ApiTags('Policies')
@ApiBearerAuth()
@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(EmployeeRole.ADMIN)
  @ApiOperation({ summary: '카드 정책 생성', description: '직원에 대한 카드 사용 정책을 생성합니다. 한도, 허용 업종/지역 설정.' })
  @ApiResponse({ status: 201, description: '정책 생성 성공' })
  @ApiResponse({ status: 400, description: '입력 데이터 유효성 검증 실패' })
  @ApiResponse({ status: 403, description: '권한 부족 (ADMIN만 가능)' })
  create(@Body() dto: CreatePolicyDto) {
    return this.policiesService.create(dto);
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: '직원별 카드 정책 조회', description: '특정 직원에게 적용된 카드 정책을 조회합니다.' })
  @ApiParam({ name: 'employeeId', description: '직원 UUID' })
  @ApiResponse({ status: 200, description: '카드 정책 정보 반환' })
  @ApiResponse({ status: 404, description: '정책을 찾을 수 없음' })
  findByEmployee(@Param('employeeId', ParseUUIDPipe) employeeId: string) {
    return this.policiesService.findByEmployeeId(employeeId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(EmployeeRole.ADMIN, EmployeeRole.FINANCE)
  @ApiOperation({ summary: '카드 정책 수정', description: '기존 카드 정책을 수정합니다. 관리자/재무 권한 필요.' })
  @ApiParam({ name: 'id', description: '정책 UUID' })
  @ApiResponse({ status: 200, description: '정책 수정 성공' })
  @ApiResponse({ status: 400, description: '입력 데이터 유효성 검증 실패' })
  @ApiResponse({ status: 403, description: '권한 부족' })
  @ApiResponse({ status: 404, description: '정책을 찾을 수 없음' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePolicyDto) {
    return this.policiesService.update(id, dto);
  }
}
