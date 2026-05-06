import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { LedgerService } from '../ledger/ledger.service';
import { LedgerSource, PayoutStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayoutsService {
  constructor(
    private readonly ledger: LedgerService,
    private readonly prisma: PrismaService,
  ) {}

  private calculateProviderPayout(totalAmount: number) {
    const safeTotal = Number(totalAmount || 0);
    const platformFee = Math.round(safeTotal * 0.1);
    const providerEarning = safeTotal - platformFee;

    return {
      totalAmount: safeTotal,
      platformFee,
      providerEarning,
    };
  }

  async requestPayout(dto: {
    accountId: string;
    amount: number;
  }) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const balance = await this.ledger.getBalance(dto.accountId);

    if (balance.lt(dto.amount)) {
      throw new BadRequestException('Insufficient balance');
    }

    return this.ledger.debitAccount({
      accountId: dto.accountId,
      amount: dto.amount,
      source: LedgerSource.WITHDRAWAL,
      reference: `WITHDRAWAL_${Date.now()}`,
    });
  }

  async payProvider(dto: {
    propertyAccountId: string;
    providerAccountId: string;
    amount: number;
  }) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    return this.ledger.recordDoubleEntry({
      debitAccountId: dto.propertyAccountId,
      creditAccountId: dto.providerAccountId,
      amount: dto.amount,
      source: LedgerSource.PROVIDER_PAYOUT,
      reference: `PROVIDER_PAYOUT_${Date.now()}`,
    });
  }

  async repairLegacyProviderPayoutsForUser(userId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!provider) {
      throw new BadRequestException('Provider profile not found');
    }

    const payouts = await this.prisma.providerPayout.findMany({
      where: {
        providerId: provider.id,
      },
      include: {
        request: {
          select: {
            id: true,
            propertyId: true,
          },
        },
        provider: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    let correctedRows = 0;
    let correctedLedger = 0;
    let skipped = 0;

    for (const payout of payouts) {
      const expected = this.calculateProviderPayout(Number(payout.totalAmount || 0));
      const currentFee = Number(payout.platformFee || 0);
      const currentNet = Number(payout.providerEarning || 0);

      const needsRowCorrection =
        currentFee !== expected.platformFee ||
        currentNet !== expected.providerEarning;

      if (!needsRowCorrection) {
        continue;
      }

      const isCompleted = payout.status === PayoutStatus.COMPLETED;
      const overCredit = expected.totalAmount - expected.providerEarning;

      if (isCompleted) {
        const propertyAccount = await this.prisma.account.findFirst({
          where: {
            propertyId: payout.request?.propertyId || undefined,
          },
          select: {
            id: true,
          },
        });

        const providerAccount = await this.prisma.account.findFirst({
          where: {
            userId: payout.provider?.userId || undefined,
          },
          select: {
            id: true,
          },
        });

        if (!propertyAccount || !providerAccount) {
          skipped++;
          continue;
        }

        if (overCredit > 0) {
          await this.ledger.recordDoubleEntry({
            debitAccountId: providerAccount.id,
            creditAccountId: propertyAccount.id,
            amount: overCredit,
            source: LedgerSource.PROVIDER_PAYOUT,
            reference: `PROVIDER_PAYOUT_LEGACY_FIX_${payout.id}`,
            propertyId: payout.request?.propertyId || undefined,
          });

          correctedLedger++;
        }
      }

      await this.prisma.providerPayout.update({
        where: {
          id: payout.id,
        },
        data: {
          platformFee: expected.platformFee,
          providerEarning: expected.providerEarning,
        },
      });

      correctedRows++;
    }

    return {
      message: 'Legacy provider payout repair completed',
      correctedRows,
      correctedLedger,
      skipped,
    };
  }

  async getProviderWallet(userId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!provider) {
      throw new BadRequestException('Provider profile not found');
    }

    const account = await this.prisma.account.findFirst({
      where: { userId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!account) {
      throw new BadRequestException('Provider wallet account not found');
    }

    const balance = await this.ledger.getBalance(account.id);

    const payouts = await this.prisma.providerPayout.findMany({
      where: {
        providerId: provider.id,
      },
      select: {
        totalAmount: true,
        providerEarning: true,
        platformFee: true,
        status: true,
      },
    });

    const grossEarnings = payouts.reduce(
      (sum, item) => sum + Number(item.totalAmount || 0),
      0,
    );

    const netEarnings = payouts.reduce(
      (sum, item) => sum + Number(item.providerEarning || 0),
      0,
    );

    const platformFees = payouts.reduce(
      (sum, item) => sum + Number(item.platformFee || 0),
      0,
    );

    const pendingPayouts = payouts.filter(
      (item) => item.status === PayoutStatus.PENDING,
    ).length;

    const completedPayouts = payouts.filter(
      (item) => item.status === PayoutStatus.COMPLETED,
    ).length;

    return {
      provider: {
        id: provider.id,
        companyName: provider.companyName,
        type: provider.type,
        verificationStatus: provider.verificationStatus,
        user: provider.user,
      },
      wallet: {
        accountId: account.id,
        balance: Number(balance.toString()),
      },
      summary: {
        grossEarnings,
        netEarnings,
        platformFees,
        pendingPayouts,
        completedPayouts,
      },
    };
  }

  async requestProviderWithdrawal(
    userId: string,
    dto: {
      amount: number;
    },
  ) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const provider = await this.prisma.serviceProvider.findUnique({
      where: { userId },
      select: {
        id: true,
      },
    });

    if (!provider) {
      throw new BadRequestException('Provider profile not found');
    }

    const account = await this.prisma.account.findFirst({
      where: { userId },
      select: {
        id: true,
      },
    });

    if (!account) {
      throw new BadRequestException('Provider wallet account not found');
    }

    const balance = await this.ledger.getBalance(account.id);

    if (balance.lt(dto.amount)) {
      throw new BadRequestException('Insufficient balance');
    }

    const withdrawal = await this.ledger.debitAccount({
      accountId: account.id,
      amount: dto.amount,
      source: LedgerSource.WITHDRAWAL,
      reference: `PROVIDER_WITHDRAWAL_${Date.now()}`,
    });

    const updatedBalance = await this.ledger.getBalance(account.id);

    return {
      message: 'Withdrawal processed successfully',
      withdrawal,
      wallet: {
        accountId: account.id,
        balance: Number(updatedBalance.toString()),
      },
    };
  }
}