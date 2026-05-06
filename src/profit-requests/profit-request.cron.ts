import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfitRequestCron {
  constructor(private prisma: PrismaService) {}

  /**
   * Runs every hour
   */
  @Cron('0 * * * *')
  async expireRequests() {
    await this.prisma.profitRequest.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: 'EXPIRED',
        processedAt: new Date(),
      },
    });

    console.log('⏰ Expired profit requests cleaned');
  }
}