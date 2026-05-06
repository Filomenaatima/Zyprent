import { Injectable } from '@nestjs/common';
import {
  LedgerSource,
  PaymentStatus,
  Prisma,
  UnitStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  private round(value: number) {
    return Number((value || 0).toFixed(2));
  }

  private incomeSources(): LedgerSource[] {
    return [
      LedgerSource.RENT_PAYMENT,
      LedgerSource.SERVICE_CHARGE_PAYMENT,
      LedgerSource.GARBAGE_PAYMENT,
      LedgerSource.OTHER_FEE_PAYMENT,
    ];
  }

  private async getActualIncome(propertyId?: string) {
    const where: Prisma.PaymentWhereInput = {
      status: PaymentStatus.SUCCESS,
      ...(propertyId
        ? {
            invoice: {
              unit: {
                propertyId,
              },
            },
          }
        : {}),
    };

    const result = await this.prisma.payment.aggregate({
      where,
      _sum: {
        amount: true,
      },
    });

    return this.round(Number(result._sum.amount ?? 0));
  }

  private async getLedgerIncome(propertyId?: string) {
    const result = await this.prisma.ledgerEntry.aggregate({
      where: {
        source: {
          in: this.incomeSources(),
        },
        credit: {
          gt: 0,
        },
        ...(propertyId ? { propertyId } : {}),
      },
      _sum: {
        credit: true,
      },
    });

    return this.round(Number(result._sum.credit ?? 0));
  }

  private async getActualExpenses(propertyId?: string) {
    const result = await this.prisma.ledgerEntry.aggregate({
      where: {
        source: LedgerSource.EXPENSE_PAYMENT,
        debit: {
          gt: 0,
        },
        ...(propertyId ? { propertyId } : {}),
      },
      _sum: {
        debit: true,
      },
    });

    return this.round(Number(result._sum.debit ?? 0));
  }

  async profitAndLoss(propertyId?: string) {
    const ledgerIncome = await this.getLedgerIncome(propertyId);
    const paymentIncome = await this.getActualIncome(propertyId);

    const income = ledgerIncome > 0 ? ledgerIncome : paymentIncome;
    const expenses = await this.getActualExpenses(propertyId);
    const netProfit = income - expenses;

    return {
      income: this.round(income),
      expenses: this.round(expenses),
      netProfit: this.round(netProfit),
    };
  }

  async cashFlow(propertyId?: string) {
    const ledgerIncome = await this.getLedgerIncome(propertyId);
    const paymentIncome = await this.getActualIncome(propertyId);

    const inflow = ledgerIncome > 0 ? ledgerIncome : paymentIncome;
    const outflow = await this.getActualExpenses(propertyId);

    return {
      inflow: this.round(inflow),
      outflow: this.round(outflow),
      netCashFlow: this.round(inflow - outflow),
    };
  }

  async propertyPerformance(propertyId: string) {
    const [totalUnits, occupiedUnits, pnl, cashFlow] = await Promise.all([
      this.prisma.unit.count({
        where: { propertyId },
      }),

      this.prisma.unit.count({
        where: {
          propertyId,
          status: UnitStatus.OCCUPIED,
        },
      }),

      this.profitAndLoss(propertyId),

      this.cashFlow(propertyId),
    ]);

    const occupancyRate =
      totalUnits === 0 ? 0 : (occupiedUnits / totalUnits) * 100;

    return {
      propertyId,
      totalUnits,
      occupiedUnits,
      occupancyRate: this.round(occupancyRate),
      financials: pnl,
      cashFlow,
    };
  }
}