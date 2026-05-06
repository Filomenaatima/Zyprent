import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportType } from '@prisma/client';

@Injectable()
export class ReportRunnerService {
  constructor(private readonly prisma: PrismaService) {}

  async run(type: ReportType, context: { userId: string; role: string }) {
    switch (type) {
      case ReportType.PROPERTY_INCOME:
        return this.propertyIncome();

      case ReportType.MANAGER_SUMMARY:
        return this.managerSummary();

      case ReportType.INVESTOR_INCOME:
        return this.investorIncome(context);

      case ReportType.INVOICE_AGING:
        return this.invoiceAging();

      default:
        throw new Error(`Unsupported report type: ${type}`);
    }
  }

  /**
   * GLOBAL property income
   */
  private async propertyIncome() {
    const invoices = await this.prisma.rentInvoice.findMany({
      where: { status: 'PAID' },
    });

    const total = invoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0,
    );

    return { totalIncome: total };
  }

  /**
   * PROPERTY SPECIFIC income
   */
  async propertyIncomeByProperty(propertyId: string) {
    const invoices = await this.prisma.rentInvoice.findMany({
      where: {
        unit: { propertyId },
        status: 'PAID',
      },
    });

    const expenses = await this.prisma.expense.findMany({
      where: { propertyId },
    });

    const totalIncome = invoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0,
    );

    const totalExpenses = expenses.reduce(
      (sum, exp) => sum + Number(exp.amount),
      0,
    );

    const netIncome = totalIncome - totalExpenses;

    return {
      propertyId,
      totalIncome,
      totalExpenses,
      netIncome,
      invoiceCount: invoices.length,
    };
  }

  /**
   * OCCUPANCY REPORT
   */
  async occupancyReport(propertyId: string) {
    const units = await this.prisma.unit.findMany({
      where: { propertyId },
    });

    const totalUnits = units.length;

    const occupiedUnits = units.filter(
      (u) => u.status === 'OCCUPIED',
    ).length;

    const vacantUnits = totalUnits - occupiedUnits;

    const occupancyRate =
      totalUnits === 0
        ? 0
        : ((occupiedUnits / totalUnits) * 100).toFixed(2);

    return {
      propertyId,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      occupancyRate: `${occupancyRate}%`,
    };
  }

  /**
   * MANAGER SUMMARY
   */
  private async managerSummary() {
    const properties = await this.prisma.property.count();
    const units = await this.prisma.unit.count();
    const residents = await this.prisma.resident.count();

    return {
      properties,
      units,
      residents,
    };
  }

  /**
   * INVESTOR REPORT (FIXED)
   */
  private async investorIncome(context: { userId: string }) {
    const investments = await this.prisma.investment.findMany({
      where: { investorId: context.userId },
    });

    const distributions = await this.prisma.profitDistribution.findMany({
      where: { investorId: context.userId },
    });

    /**
     * ✅ FIX: investorId → userId
     */
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: context.userId },
    });

    const totalInvested = investments.reduce(
      (sum, inv) => sum + Number(inv.amount),
      0,
    );

    const totalProfit = distributions.reduce(
      (sum, dist) => sum + Number(dist.amount),
      0,
    );

    const roi =
      totalInvested === 0
        ? 0
        : ((totalProfit / totalInvested) * 100).toFixed(2);

    return {
      totalInvested,
      totalProfit,
      walletBalance: Number(wallet?.balance ?? 0),
      roi: `${roi}%`,
    };
  }

  /**
   * INVOICE AGING REPORT
   */
  private async invoiceAging() {
    const today = new Date();

    const invoices = await this.prisma.rentInvoice.findMany({
      where: {
        status: {
          in: ['ISSUED', 'OVERDUE', 'PARTIALLY_PAID'],
        },
      },
    });

    let current = 0;
    let overdue1to30 = 0;
    let overdue31to60 = 0;
    let overdue61plus = 0;

    for (const invoice of invoices) {
      const outstanding =
        Number(invoice.totalAmount) - Number(invoice.paidAmount);

      if (outstanding <= 0) continue;

      const dueDate = new Date(invoice.dueDate);

      const diffDays = Math.floor(
        (today.getTime() - dueDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (diffDays <= 0) {
        current += outstanding;
      } else if (diffDays <= 30) {
        overdue1to30 += outstanding;
      } else if (diffDays <= 60) {
        overdue31to60 += outstanding;
      } else {
        overdue61plus += outstanding;
      }
    }

    const totalOutstanding =
      current + overdue1to30 + overdue31to60 + overdue61plus;

    return {
      summary: {
        current,
        overdue1to30,
        overdue31to60,
        overdue61plus,
        totalOutstanding,
      },
      invoiceCount: invoices.length,
    };
  }
}