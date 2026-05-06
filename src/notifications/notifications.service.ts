import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

type NotificationStatusFilter = 'read' | 'unread' | 'all';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  async sendNotification(
    userId: string,
    title: string,
    message: string,
    email?: string,
    phone?: string,
    type: NotificationType = NotificationType.SYSTEM,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
      },
    });

    if (!user) {
      this.logger.warn(`Notification skipped: user not found ${userId}`);
      return null;
    }

    const cleanTitle = title.trim();
    const cleanMessage = message.trim();

    if (!cleanTitle || !cleanMessage) {
      this.logger.warn(
        `Notification skipped: empty title/message for ${userId}`,
      );
      return null;
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title: cleanTitle,
        message: cleanMessage,
        type,
        isRead: false,
      },
    });

    const targetEmail = email || user.email || undefined;
    const targetPhone = phone || user.phone || undefined;

    if (targetEmail) {
      try {
        await this.emailService.sendEmail(targetEmail, cleanTitle, cleanMessage);
      } catch (error: any) {
        this.logger.error(
          `Email send failed for ${targetEmail}: ${error?.message || error}`,
        );
      }
    }

    if (targetPhone) {
      try {
        await this.smsService.sendSMS(targetPhone, cleanMessage);
      } catch (error: any) {
        this.logger.error(
          `SMS send failed for ${targetPhone}: ${error?.message || error}`,
        );
      }
    }

    return notification;
  }

  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    email?: string;
    phone?: string;
    type?: NotificationType;
  }) {
    return this.sendNotification(
      data.userId,
      data.title,
      data.message,
      data.email,
      data.phone,
      data.type ?? NotificationType.SYSTEM,
    );
  }

  async getUserNotifications(
    userId: string,
    options?: {
      type?: NotificationType;
      status?: NotificationStatusFilter;
    },
  ) {
    const where: {
      userId: string;
      type?: NotificationType;
      isRead?: boolean;
    } = { userId };

    if (options?.type) {
      where.type = options.type;
    }

    if (options?.status === 'read') {
      where.isRead = true;
    }

    if (options?.status === 'unread') {
      where.isRead = false;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  async getNotificationSummary(userId: string) {
    const [total, unread, read, grouped, latest] = await Promise.all([
      this.prisma.notification.count({
        where: { userId },
      }),
      this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
      this.prisma.notification.count({
        where: {
          userId,
          isRead: true,
        },
      }),
      this.prisma.notification.groupBy({
        by: ['type'],
        where: { userId },
        _count: {
          type: true,
        },
      }),
      this.prisma.notification.findFirst({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    ]);

    const byType = grouped.reduce<Record<string, number>>((acc, row) => {
      acc[row.type] = row._count.type;
      return acc;
    }, {});

    return {
      total,
      unread,
      read,
      byType,
      latestActivity: latest?.createdAt ?? null,
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
      select: {
        id: true,
        isRead: true,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.isRead) {
      return this.prisma.notification.findUnique({
        where: { id: notificationId },
      });
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return {
      updated: result.count,
    };
  }
}