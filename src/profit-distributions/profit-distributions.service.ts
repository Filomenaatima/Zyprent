import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  LedgerSource,
  NotificationType,
  AccountType,
  Prisma,
  WalletTransactionType,
  WalletTransactionStatus,
} from '@prisma/client';

@Injectable()
export class ProfitDistributionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async distributeProfit(data: {
    propertyId: string;
    totalProfit: number;
    periodMonth: number;
    periodYear: number;
    creditWallet?: boolean;
  }) {
    const {
      propertyId,
      totalProfit,
      periodMonth,
      periodYear,
      creditWallet,
    } = data;

    if (totalProfit <= 0) {
      throw new BadRequestException('Profit must be > 0');
    }

    return this.prisma.$transaction(async (tx) => {
      const property = await tx.property.findUnique({
        where: { id: propertyId },
      });

      if (!property) {
        throw new NotFoundException('Property not found');
      }

      try {
        await tx.propertyProfit.create({
          data: {
            propertyId,
            periodMonth,
            periodYear,
            totalProfit,
            distributedAmount: totalProfit,
          },
        });
      } catch (error) {
        throw new BadRequestException(
          'Profit already distributed for this period',
        );
      }

      let propertyAccount = await tx.account.findUnique({
        where: { propertyId },
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

      const totalProfitDecimal = new Prisma.Decimal(totalProfit);

      if (propertyAccount.balance.lt(totalProfitDecimal)) {
        throw new BadRequestException('Insufficient property funds');
      }

      const investors = await tx.investorShare.findMany({
        where: { propertyId },
        include: { investor: true },
      });

      if (!investors.length) {
        throw new BadRequestException('No investors found');
      }

      const distributions = [];

      for (const investor of investors) {
        const ownership = investor.sharesOwned / 100;

        const payout = totalProfitDecimal
          .mul(ownership)
          .toDecimalPlaces(2);

        if (payout.lte(0)) continue;

        let investorAccount = await tx.account.findUnique({
          where: { userId: investor.investorId },
        });

        if (!investorAccount) {
          investorAccount = await tx.account.create({
            data: {
              userId: investor.investorId,
              type: AccountType.USER,
              balance: new Prisma.Decimal(0),
            },
          });
        }

        await tx.profitDistribution.create({
          data: {
            propertyId,
            investorId: investor.investorId,
            amount: payout,
            periodMonth,
            periodYear,
          },
        });

        await tx.account.update({
          where: { id: propertyAccount.id },
          data: { balance: { decrement: payout } },
        });

        await tx.account.update({
          where: { id: investorAccount.id },
          data: { balance: { increment: payout } },
        });

        await tx.ledgerEntry.createMany({
          data: [
            {
              accountId: propertyAccount.id,
              debit: payout,
              credit: new Prisma.Decimal(0),
              source: LedgerSource.PROFIT_DISTRIBUTION,
              propertyId,
            },
            {
              accountId: investorAccount.id,
              debit: new Prisma.Decimal(0),
              credit: payout,
              source: LedgerSource.PROFIT_DISTRIBUTION,
              propertyId,
            },
          ],
        });

        if (creditWallet) {
          const wallet = await tx.wallet.upsert({
            where: { userId: investor.investorId },
            update: { balance: { increment: payout } },
            create: {
              userId: investor.investorId,
              balance: payout,
            },
          });

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: WalletTransactionType.PROFIT,
              amount: payout,
              status: WalletTransactionStatus.COMPLETED,
            },
          });
        }

        const roi =
          investor.amountPaid > 0
            ? payout.toNumber() / investor.amountPaid
            : 0;

        await this.notificationsService.createNotification({
          userId: investor.investorId,
          title: 'Profit Distribution',
          message: `You earned ${payout.toNumber()} (ROI ${(roi * 100).toFixed(2)}%)`,
          type: NotificationType.PROFIT_DISTRIBUTION,
        });

        distributions.push({
          investorId: investor.investorId,
          ownership: investor.sharesOwned,
          payout: payout.toNumber(),
          roi: Number((roi * 100).toFixed(2)),
        });
      }

      const totalInvested = investors.reduce(
        (sum, i) => sum + i.amountPaid,
        0,
      );

      const yieldPercent =
        totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

      return {
        message: 'Profit distributed successfully',
        totalProfit,
        yield: Number(yieldPercent.toFixed(2)),
        distributions,
      };
    });
  }

  async getInvestorEarnings(investorId: string) {
    return this.prisma.profitDistribution.findMany({
      where: { investorId },
      include: {
        property: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPropertyDistributions(propertyId: string) {
    return this.prisma.profitDistribution.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
    });
  }
}