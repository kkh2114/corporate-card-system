import { Controller, Get, Patch, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '내 알림 목록 조회', description: '로그인한 사용자의 알림 목록을 조회합니다.' })
  @ApiQuery({ name: 'unreadOnly', required: false, description: '읽지 않은 알림만 조회 (true/false)', example: 'true' })
  @ApiResponse({ status: 200, description: '알림 목록 반환' })
  getMyNotifications(
    @CurrentUser('id') userId: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.getByEmployee(
      userId,
      unreadOnly === 'true',
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: '읽지 않은 알림 개수', description: '읽지 않은 알림 개수를 반환합니다.' })
  @ApiResponse({ status: 200, description: '읽지 않은 알림 개수 반환' })
  getUnreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리', description: '특정 알림을 읽음 상태로 변경합니다.' })
  @ApiParam({ name: 'id', description: '알림 UUID' })
  @ApiResponse({ status: 200, description: '알림 읽음 처리 성공' })
  @ApiResponse({ status: 404, description: '알림을 찾을 수 없음' })
  markAsRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: '전체 알림 읽음 처리', description: '로그인한 사용자의 모든 알림을 읽음 상태로 변경합니다.' })
  @ApiResponse({ status: 200, description: '전체 알림 읽음 처리 성공' })
  markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }
}
