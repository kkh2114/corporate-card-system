import {
  Controller, Get, Post, Put, Delete, Body, Param, ParseUUIDPipe, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { EmployeeRole } from './entities/employee.entity';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(EmployeeRole.ADMIN)
  @ApiOperation({ summary: '직원 등록', description: '새 직원을 등록합니다. 관리자 권한 필요.' })
  @ApiResponse({ status: 201, description: '직원 등록 성공' })
  @ApiResponse({ status: 400, description: '입력 데이터 유효성 검증 실패' })
  @ApiResponse({ status: 403, description: '권한 부족 (ADMIN만 가능)' })
  @ApiResponse({ status: 409, description: '이미 존재하는 사번 또는 이메일' })
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(EmployeeRole.ADMIN, EmployeeRole.FINANCE, EmployeeRole.MANAGER)
  @ApiOperation({ summary: '직원 목록 조회', description: '전체 직원 목록을 조회합니다. 관리자/재무/매니저 권한 필요.' })
  @ApiResponse({ status: 200, description: '직원 목록 반환' })
  @ApiResponse({ status: 403, description: '권한 부족' })
  findAll() {
    return this.employeesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '직원 상세 조회', description: 'UUID로 특정 직원의 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'id', description: '직원 UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: '직원 상세 정보 반환' })
  @ApiResponse({ status: 404, description: '직원을 찾을 수 없음' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(EmployeeRole.ADMIN)
  @ApiOperation({ summary: '직원 정보 수정', description: '직원 정보를 수정합니다. 관리자 권한 필요.' })
  @ApiParam({ name: 'id', description: '직원 UUID' })
  @ApiResponse({ status: 200, description: '직원 정보 수정 성공' })
  @ApiResponse({ status: 400, description: '입력 데이터 유효성 검증 실패' })
  @ApiResponse({ status: 403, description: '권한 부족 (ADMIN만 가능)' })
  @ApiResponse({ status: 404, description: '직원을 찾을 수 없음' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(EmployeeRole.ADMIN)
  @ApiOperation({ summary: '직원 삭제', description: '직원을 삭제합니다. 관리자 권한 필요.' })
  @ApiParam({ name: 'id', description: '직원 UUID' })
  @ApiResponse({ status: 200, description: '직원 삭제 성공' })
  @ApiResponse({ status: 403, description: '권한 부족 (ADMIN만 가능)' })
  @ApiResponse({ status: 404, description: '직원을 찾을 수 없음' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeesService.remove(id);
  }
}
