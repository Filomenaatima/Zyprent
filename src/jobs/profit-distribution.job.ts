import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  AccountType,
  ExpenseStatus,
  InvoiceStatus,
  LedgerSource,
  Prisma,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfitDistributionJob {
  private readonly logger = new Logger(ProfitDistributionJob.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Runs every 1st of the month at midnight
   */
  @Cron('0 0 1 * *')
  async runMonthlyDistribution() {
    this.logger.log('Starting monthly profit distribution');

    const properties = await this.prisma.property.findMany({
      select: { id: true },
    });

    for (const property of properties) {
      await this.distributeForProperty(property.id);
    }

    this.logger.log('Monthly profit distribution completed');
  }

  async distributeForProperty(propertyId: string) {
    const now = new Date();
    const periodMonth = now.getMonth() + 1;
    const periodYear = now.getFullYear();

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.profitDistribution.findFirst({
        where: {
          propertyId,
          periodMonth,
          periodYear,
        },
      });

      if (existing) {
        this.logger.warn(
          `Skipping property ${propertyId} — already distributed for ${periodMonth}/${periodYear}`,
        );
        return {
          skipped: true,
          reason: 'Already distributed for this period',
        };
      }

      const property = await tx.property.findUnique({
        where: { id: propertyId },
        select: { id: true, title: true },
      });

      if (!property) {
        throw new BadRequestException('Property not found');
      }

      const investments = await tx.investment.findMany({
        where: { propertyId },
      });

      if (!investments.length) {
        return {
          skipped: true,
          reason: 'No investments found',
        };
      }

      const rentAgg = await tx.rentInvoice.aggregate({
        where: {
          unit: { propertyId },
          status: InvoiceStatus.PAID,
        },
        _sum: { paidAmount: true },
      });

      const expenseAgg = await tx.expense.aggregate({
        where: {
          propertyId,
          status: ExpenseStatus.PAID,
        },
        _sum: { amount: true },
      });

      const totalRent = new Prisma.Decimal(rentAgg._sum.paidAmount ?? 0);
      const totalExpenses = new Prisma.Decimal(expenseAgg._sum.amount ?? 0);
      const netProfit = totalRent.minus(totalExpenses);

      if (netProfit.lte(0)) {
        return {
          skipped: true,
          reason: 'No distributable profit',
          totalRent: totalRent.toNumber(),
          totalExpenses: totalExpenses.toNumber(),
          netProfit: netProfit.toNumber(),
        };
      }

      const totalInvested = investments.reduce(
        (sum, inv) => sum.plus(inv.amount),
        new Prisma.Decimal(0),
      );

      if (totalInvested.lte(0)) {
        throw new BadRequestException('Invalid investment base');
      }

      let propertyAccount = await tx.account.findFirst({
        where: {
          propertyId,
          type: AccountType.PROPERTY,
        },
      });

      if (!propertyAccount) {
        propertyAccount = await tx.account.create({
          data: {
            propertyId,
            type: AccountType.PROPERTY,
            balance: new Prisma.Decimal(0),
          },
        });
      }

      const referenceBase = `PROFIT-${property.title
        .replace(/\s+/g, '-')
        .toUpperCase()}-${periodMonth}-${periodYear}`;

      const distributions: {
        investorId: string;
        amount: number;
        ratio: number;
        reference: string;
      }[] = [];

      let distributedTotal = new Prisma.Decimal(0);

      for (let i = 0; i < investments.length; i++) {
        const investment = investments[i];

        const isLast = i === investments.length - 1;

        const ratio = new Prisma.Decimal(investment.amount).div(totalInvested);

        const payout = isLast
          ? netProfit.minus(distributedTotal)
          : netProfit.mul(ratio).toDecimalPlaces(0);

        if (payout.lte(0)) continue;

        distributedTotal = distributedTotal.plus(payout);

        let investorAccount = await tx.account.findFirst({
          where: {
            userId: investment.investorId,
            type: AccountType.USER,
          },
        });

        if (!investorAccount) {
          investorAccount = await tx.account.create({
            data: {
              userId: investment.investorId,
              type: AccountType.USER,
              balance: new Prisma.Decimal(0),
            },
          });
        }

        const wallet = await tx.wallet.upsert({
          where: { userId: investment.investorId },
          update: {
            balance: { increment: payout },
          },
          create: {
            userId: investment.investorId,
            balance: payout,
          },
        });

        const reference = `${referenceBase}-${investment.investorId.slice(
          0,
          8,
        )}`;

        await tx.account.update({
          where: { id: propertyAccount.id },
          data: {
            balance: { decrement: payout },
          },
        });

        await tx.account.update({
          where: { id: investorAccount.id },
          data: {
            balance: { increment: payout },
          },
        });

        await tx.ledgerEntry.createMany({
          data: [
            {
              accountId: propertyAccount.id,
              debit: payout,
              credit: new Prisma.Decimal(0),
              source: LedgerSource.PROFIT_DISTRIBUTION,
              propertyId,
              reference,
            },
            {
              accountId: investorAccount.id,
              debit: new Prisma.Decimal(0),
              credit: payout,
              source: LedgerSource.PROFIT_DISTRIBUTION,
              propertyId,
              reference,
            },
          ],
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: WalletTransactionType.PROFIT,
            amount: payout,
            status: WalletTransactionStatus.COMPLETED,
            reference,
          },
        });

        await tx.profitDistribution.create({
          data: {
            propertyId,
            investorId: investment.investorId,
            amount: payout,
            periodMonth,
            periodYear,
          },
        });

        distributions.push({
          investorId: investment.investorId,
          amount: payout.toNumber(),
          ratio: Number(ratio.mul(100).toDecimalPlaces(2)),
          reference,
        });
      }

      this.logger.log(
        `Distributed ${distributedTotal.toNumber()} for ${property.title}`,
      );

      return {
        skipped: false,
        propertyId,
        property: property.title,
        periodMonth,
        periodYear,
        totalRent: totalRent.toNumber(),
        totalExpenses: totalExpenses.toNumber(),
        netProfit: netProfit.toNumber(),
        distributedTotal: distributedTotal.toNumber(),
        distributions,
      };
    });
  }
}