import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('notifications')
@UseGuards(JwtGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Post()
  send(@Body() dto: SendNotificationDto) {
    return this.service.sendNotification(
      dto.userId,
      dto.title,
      dto.message,
      dto.email,
      dto.phone,
      dto.type,
    );
  }

  @Get('me')
  getMyNotifications(
    @Req() req: Request,
    @Query('type') type?: NotificationType,
    @Query('status') status?: 'read' | 'unread' | 'all',
  ) {
    const userId = (req.user as any).id;
    return this.service.getUserNotifications(userId, { type, status });
  }

  @Get('me/summary')
  getMySummary(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.service.getNotificationSummary(userId);
  }

  @Patch('me/read-all')
  markAllAsRead(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.service.markAllAsRead(userId);
  }

  @Patch(':notificationId/read')
  markAsRead(
    @Req() req: Request,
    @Param('notificationId') notificationId: string,
  ) {
    const userId = (req.user as any).id;
    return this.service.markAsRead(userId, notificationId);
  }

  @Get(':userId')
  getUserNotificationsByAdmin(
    @Param('userId') userId: string,
    @Query('type') type?: NotificationType,
    @Query('status') status?: 'read' | 'unread' | 'all',
  ) {
    return this.service.getUserNotifications(userId, { type, status });
  }
}