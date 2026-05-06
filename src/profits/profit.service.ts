import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfitService {
  constructor(private prisma: PrismaService) {}

  /**
   * ✅ AVAILABLE PROFIT (NOT YET DISTRIBUTED)
   */
  async getAvailableProfit(propertyId: string) {
    const profits = await this.prisma.propertyProfit.findMany({
      where: { propertyId },
    });

    const distributions = await this.prisma.profitDistribution.findMany({
      where: { propertyId },
    });

    const totalProfit = profits.reduce((sum, p) => sum + p.totalProfit, 0);

    const distributed = distributions.reduce(
      (sum, d) => sum + Number(d.amount),
      0,
    );

    return {
      totalProfit,
      distributed,
      available: totalProfit - distributed,
    };
  }

  /**
   * ✅ INVESTOR VIEW
   */
  async getInvestorProfit(investorId: string) {
    const earnings = await this.prisma.profitDistribution.findMany({
      where: { investorId },
    });

    const total = earnings.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );

    return {
      totalEarned: total,
      history: earnings,
    };
  }
}