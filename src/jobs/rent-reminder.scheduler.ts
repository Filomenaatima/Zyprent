import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RentReminderScheduler {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('rent-reminder') private queue: Queue,
  ) {}

  @Cron('0 0 * * *')
  async handleReminders() {
    const contracts = await this.prisma.rentContract.findMany({
      include: { resident: true },
    });

    const today = new Date();

    for (const contract of contracts) {
      const dueDate = new Date(contract.nextBillingDate);

      const diffDays = Math.ceil(
        (dueDate.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (diffDays === 7) {
        await this.queue.add('rent-upcoming', {
          residentId: contract.residentId,
          type: 'UPCOMING',
        });
      }

      if (diffDays === -7) {
        await this.queue.add('rent-overdue', {
          residentId: contract.residentId,
          type: 'OVERDUE',
        });
      }
    }
  }
}