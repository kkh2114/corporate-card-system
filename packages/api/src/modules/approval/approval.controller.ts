import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ApprovalService } from './approval.service';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { ProcessApprovalDto } from './dto/process-approval.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { EmployeeRole } from '../employees/entities/employee.entity';

@ApiTags('Approvals')
@ApiBearerAuth()
@Controller('approvals')
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Post()
  @ApiOperation({ summary: '승인 요청 생성', description: '한도 초과, 업종 차단 등으로 인한 승인 요청을 생성합니다.' })
  @ApiResponse({ status: 201, description: '승인 요청 생성 성공' })
  @ApiResponse({ status: 400, description: '입력 데이터 유효성 검증 실패' })
  create(@Request() req: any, @Body() dto: CreateApprovalDto) {
    return this.approvalService.createApprovalRequest(req.user.id, dto);
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(EmployeeRole.MANAGER, EmployeeRole.FINANCE, EmployeeRole.ADMIN)
  @ApiOperation({ summary: '대기 중 승인 요청 조회', description: '현재 사용자의 역할에 해당하는 대기 중인 승인 요청 목록을 조회합니다.' })
  @ApiResponse({ status: 200, description: '대기 중 승인 요청 목록 반환' })
  @ApiResponse({ status: 403, description: '권한 부족' })
  findPending(@Request() req: any) {
    return this.approvalService.findPendingByRole(req.user.role);
  }

  @Get('transaction/:transactionId')
  @ApiOperation({ summary: '거래별 승인 요청 조회', description: '특정 거래에 연결된 승인 요청을 조회합니다.' })
  @ApiParam({ name: 'transactionId', description: '거래 UUID' })
  @ApiResponse({ status: 200, description: '해당 거래의 승인 요청 반환' })
  findByTransaction(
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
  ) {
    return this.approvalService.findByTransaction(transactionId);
  }

  @Get(':id')
  @ApiOperation({ summary: '승인 요청 상세 조회', description: '승인 요청의 상세 정보를 조회합니다. 승인 단계 이력 포함.' })
  @ApiParam({ name: 'id', description: '승인 요청 UUID' })
  @ApiResponse({ status: 200, description: '승인 요청 상세 정보 반환' })
  @ApiResponse({ status: 404, description: '승인 요청을 찾을 수 없음' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.approvalService.findOne(id);
  }

  @Post(':id/process')
  @UseGuards(RolesGuard)
  @Roles(EmployeeRole.MANAGER, EmployeeRole.FINANCE, EmployeeRole.ADMIN)
  @ApiOperation({ summary: '승인/거절 처리', description: '승인 요청을 승인하거나 거절합니다. 코멘트를 추가할 수 있습니다.' })
  @ApiParam({ name: 'id', description: '승인 요청 UUID' })
  @ApiResponse({ status: 200, description: '승인/거절 처리 성공' })
  @ApiResponse({ status: 403, description: '권한 부족' })
  @ApiResponse({ status: 404, description: '승인 요청을 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 처리된 승인 요청' })
  process(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Body() dto: ProcessApprovalDto,
  ) {
    return this.approvalService.processStep(
      id,
      req.user.id,
      req.user.role,
      dto.action,
      dto.comment,
    );
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '승인 요청 취소', description: '자신이 생성한 대기 중인 승인 요청을 취소합니다.' })
  @ApiParam({ name: 'id', description: '승인 요청 UUID' })
  @ApiResponse({ status: 200, description: '승인 요청 취소 성공' })
  @ApiResponse({ status: 403, description: '본인이 생성한 요청만 취소 가능' })
  @ApiResponse({ status: 404, description: '승인 요청을 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 처리된 요청은 취소 불가' })
  cancel(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.approvalService.cancelRequest(id, req.user.id);
  }
}
