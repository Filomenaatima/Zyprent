import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Processor('rent-reminder')
@Injectable()
export class RentReminderProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<any>) {
    const { residentId, type } = job.data;

    const resident = await this.prisma.resident.findUnique({
      where: { id: residentId },
      include: { user: true },
    });

    if (!resident) return;

    if (type === 'UPCOMING') {
      await this.notificationsService.createNotification({
        userId: resident.userId,
        title: 'Rent Reminder',
        message: 'Your rent is due in 7 days.',
        type: NotificationType.SYSTEM,
      });
    }

    if (type === 'OVERDUE') {
      await this.notificationsService.createNotification({
        userId: resident.userId,
        title: 'Rent Overdue',
        message: 'Your rent payment is overdue.',
        type: NotificationType.SYSTEM,
      });
    }
  }
}