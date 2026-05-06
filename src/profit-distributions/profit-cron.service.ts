import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProfitDistributionsService } from './profit-distributions.service';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class ProfitCronService {
  private readonly logger = new Logger(ProfitCronService.name);

  constructor(
    private prisma: PrismaService,
    private profitService: ProfitDistributionsService,
  ) {}

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async distributeMonthlyProfit() {
    const properties = await this.prisma.property.findMany();

    const now = new Date();

    /**
     * ✅ Use PREVIOUS MONTH (important)
     */
    const month = now.getMonth() - 1;
    const year =
      month < 0 ? now.getFullYear() - 1 : now.getFullYear();

    const normalizedMonth = month < 0 ? 11 : month;

    for (const property of properties) {
      try {
        const totalProfit = await this.calculateProfit(
          property.id,
          normalizedMonth,
          year,
        );

        if (totalProfit <= 0) {
          this.logger.log(
            `No profit for property ${property.id} (${normalizedMonth}/${year})`,
          );
          continue;
        }

        await this.profitService.distributeProfit({
          propertyId: property.id,
          totalProfit,
          periodMonth: normalizedMonth + 1,
          periodYear: year,
          creditWallet: true,
        });

        this.logger.log(
          `Distributed profit for property ${property.id}: ${totalProfit}`,
        );
      } catch (err) {
        if (err instanceof Error) {
          this.logger.warn(
            `Skipped ${property.id}: ${err.message}`,
          );
        } else {
          this.logger.warn(
            `Skipped ${property.id}: Unknown error`,
          );
        }
      }
    }
  }

  /**
   * ✅ MONTH-BASED PROFIT CALCULATION
   */
  private async calculateProfit(
    propertyId: string,
    month: number,
    year: number,
  ): Promise<number> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 1);

    /**
     * ✅ RENT COLLECTED (ONLY PAID INVOICES)
     */
    const rent = await this.prisma.rentInvoice.aggregate({
      _sum: { paidAmount: true },
      where: {
        status: InvoiceStatus.PAID,
        updatedAt: {
          gte: startDate,
          lt: endDate,
        },
        rentContract: {
          unit: {
            propertyId: propertyId,
          },
        },
      },
    });

    const totalRent = Number(rent._sum?.paidAmount ?? 0);

    /**
     * ✅ EXPENSES
     */
    let totalExpenses = 0;

    const expenses = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        propertyId,
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    totalExpenses = Number(expenses._sum?.amount ?? 0);

    /**
     * ✅ NET PROFIT
     */
    const profit = totalRent - totalExpenses;

    return profit > 0 ? profit : 0;
  }
}