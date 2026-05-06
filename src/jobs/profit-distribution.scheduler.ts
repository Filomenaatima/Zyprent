import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { PROFIT_QUEUE } from './profit.queue';

@Injectable()
export class ProfitDistributionScheduler {
  constructor(
    private prisma: PrismaService,
    @InjectQueue(PROFIT_QUEUE) private queue: Queue,
  ) {}

  // runs first day of every month
  @Cron('0 0 1 * *')
  async distributeMonthlyProfit() {

    console.log('Starting monthly profit distribution job');

    const offers = await this.prisma.investmentOffer.findMany({
      where: { isActive: true }
    });

    const now = new Date();
    const periodMonth = now.getMonth() + 1;
    const periodYear = now.getFullYear();

    for (const offer of offers) {

      const propertyId = offer.propertyId;

      // total rent collected
      const rent = await this.prisma.rentInvoice.aggregate({
        _sum: {
          paidAmount: true
        },
        where: {
          unit: {
            propertyId
          }
        }
      });

      const totalRent = Number(rent._sum.paidAmount || 0);

      if (totalRent === 0) continue;

      // estimate expenses (20%)
      const expenses = totalRent * 0.2;

      const profit = totalRent - expenses;

      const profitPerShare = profit / offer.totalShares;

      await this.queue.add('profit-distribution', {
        propertyId,
        profitPerShare,
        periodMonth,
        periodYear
      });

      console.log(`Queued profit distribution for property ${propertyId}`);
    }

    console.log('Monthly profit distribution job completed');
  }
}