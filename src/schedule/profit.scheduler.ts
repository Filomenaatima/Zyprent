import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { InvestmentService } from '../investment/investment.service';

@Injectable()
export class ProfitScheduler {
  constructor(
    private prisma: PrismaService,
    private investmentService: InvestmentService,
  ) {}

  @Cron('0 0 1 * *') // every 1st day of month
  async distributeMonthlyProfits() {
    const properties = await this.prisma.property.findMany();

    for (const property of properties) {
      try {
        await this.investmentService.distributeProfit(property.id);
      } catch (err) {
        console.log(`No investors for property ${property.id}`);
      }
    }

    console.log('Monthly profit distribution completed');
  }
}