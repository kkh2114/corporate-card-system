import {
  Controller, Get, Post, Param, Query, Body, ParseUUIDPipe, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { ApproveTransactionDto, RejectTransactionDto } from './dto/approve-transaction.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { EmployeeRole } from '../employees/entities/employee.entity';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({
    summary: '거래 내역 조회',
    description: '카드 사용 거래 내역을 페이지네이션으로 조회합니다. 상태, 기간, 직원별 필터 지원.',
  })
  @ApiResponse({ status: 200, description: '거래 내역 목록 및 페이지네이션 메타데이터 반환' })
  findAll(@Query() query: GetTransactionsDto) {
    return this.transactionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: '거래 상세 조회',
    description: '거래 ID로 상세 정보를 조회합니다. 영수증, OCR 결과, 위치 정보, 검증 로그 포함.',
  })
  @ApiParam({ name: 'id', description: '거래 UUID' })
  @ApiResponse({ status: 200, description: '거래 상세 정보 (영수증, OCR, 위치, 검증 로그 포함)' })
  @ApiResponse({ status: 404, description: '거래를 찾을 수 없음' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.transactionsService.findOne(id);
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(EmployeeRole.ADMIN, EmployeeRole.FINANCE, EmployeeRole.MANAGER)
  @ApiOperation({ summary: '거래 승인', description: '대기 중인 거래를 승인합니다. 관리자/재무/매니저 권한 필요.' })
  @ApiParam({ name: 'id', description: '거래 UUID' })
  @ApiResponse({ status: 200, description: '거래 승인 성공. transactionId, status, approvedBy, approvedAt 반환' })
  @ApiResponse({ status: 403, description: '권한 부족' })
  @ApiResponse({ status: 404, description: '거래를 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 처리된 거래' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveTransactionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionsService.approve(id, userId, dto.note);
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(EmployeeRole.ADMIN, EmployeeRole.FINANCE, EmployeeRole.MANAGER)
  @ApiOperation({ summary: '거래 거절', description: '대기 중인 거래를 거절합니다. 사유 필수. 관리자/재무/매니저 권한 필요.' })
  @ApiParam({ name: 'id', description: '거래 UUID' })
  @ApiResponse({ status: 200, description: '거래 거절 성공' })
  @ApiResponse({ status: 400, description: '거절 사유 누락' })
  @ApiResponse({ status: 403, description: '권한 부족' })
  @ApiResponse({ status: 404, description: '거래를 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 처리된 거래' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectTransactionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionsService.reject(id, userId, dto.reason);
  }
}
