import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AccountType,
  LedgerSource,
  PaymentProvider,
  Prisma,
  WalletTransactionStatus,
  WalletTransactionType,
  WithdrawalMethod,
  WithdrawalStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { WithdrawalPayoutService } from './withdrawal-payout.service';

type WalletTransactionListItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  amount: number;
  direction: 'positive' | 'negative';
  status: string;
  reference: string;
};

type RequestWithdrawalInput = {
  amount: number;
  method?: WithdrawalMethod;
  phoneNumber?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  cardLast4?: string;
};

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly payoutService: WithdrawalPayoutService,
  ) {}

  private async getOrCreateUserAccount(
    userId: string,
    tx: Prisma.TransactionClient,
  ) {
    let account = await tx.account.findFirst({
      where: { userId, type: AccountType.USER },
    });

    if (!account) {
      account = await tx.account.create({
        data: { userId, type: AccountType.USER },
      });
    }

    return account;
  }

  private async getOrCreatePlatformAccount(tx: Prisma.TransactionClient) {
    let account = await tx.account.findFirst({
      where: { type: AccountType.PLATFORM },
      orderBy: { createdAt: 'asc' },
    });

    if (!account) {
      account = await tx.account.create({
        data: { type: AccountType.PLATFORM },
      });
    }

    return account;
  }

  private validateWithdrawalDestination(input: RequestWithdrawalInput) {
    const method = input.method ?? WithdrawalMethod.MOBILE_MONEY;

    if (method === WithdrawalMethod.MOBILE_MONEY && !input.phoneNumber?.trim()) {
      throw new BadRequestException(
        'Phone number is required for mobile money withdrawals',
      );
    }

    if (method === WithdrawalMethod.BANK) {
      if (!input.bankName?.trim()) {
        throw new BadRequestException('Bank name is required');
      }

      if (!input.accountName?.trim()) {
        throw new BadRequestException('Account name is required');
      }

      if (!input.accountNumber?.trim()) {
        throw new BadRequestException('Account number is required');
      }
    }

    if (method === WithdrawalMethod.CARD && !input.cardLast4?.trim()) {
      throw new BadRequestException('Card last 4 digits are required');
    }

    return method;
  }

  private validateSavedWithdrawalDestination(request: {
    method: WithdrawalMethod;
    phoneNumber?: string | null;
    bankName?: string | null;
    accountName?: string | null;
    accountNumber?: string | null;
    cardLast4?: string | null;
  }) {
    if (
      request.method === WithdrawalMethod.MOBILE_MONEY &&
      !request.phoneNumber?.trim()
    ) {
      throw new BadRequestException(
        'Cannot complete payout without mobile money phone number',
      );
    }

    if (request.method === WithdrawalMethod.BANK) {
      if (!request.bankName?.trim()) {
        throw new BadRequestException('Cannot complete payout without bank name');
      }

      if (!request.accountName?.trim()) {
        throw new BadRequestException(
          'Cannot complete payout without account name',
        );
      }

      if (!request.accountNumber?.trim()) {
        throw new BadRequestException(
          'Cannot complete payout without account number',
        );
      }
    }

    if (request.method === WithdrawalMethod.CARD && !request.cardLast4?.trim()) {
      throw new BadRequestException(
        'Cannot complete payout without card destination',
      );
    }
  }

  async getOrCreateWallet(userId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;

    let wallet = await db.wallet.findUnique({ where: { userId } });

    if (!wallet) {
      wallet = await db.wallet.create({
        data: { userId, balance: new Prisma.Decimal(0) },
      });
    }

    return wallet;
  }

  async getOrCreateWalletWithTx(userId: string, tx: Prisma.TransactionClient) {
    return this.getOrCreateWallet(userId, tx);
  }

  async getUserBalance(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const db = tx ?? this.prisma;

    const account = await db.account.findFirst({
      where: { userId, type: AccountType.USER },
    });

    return Number(account?.balance ?? 0);
  }

  async syncWalletWithLedger(userId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;

    const account = await db.account.findFirst({
      where: { userId, type: AccountType.USER },
    });

    const balance = Number(account?.balance ?? 0);
    const wallet = await this.getOrCreateWallet(userId, db);

    await db.wallet.update({
      where: { id: wallet.id },
      data: { balance: new Prisma.Decimal(balance) },
    });

    return balance;
  }

  async creditWallet(params: {
    userId: string;
    amount: number;
    reference: string;
    type?: WalletTransactionType;
    tx?: Prisma.TransactionClient;
  }) {
    const db = params.tx ?? this.prisma;

    if (!params.amount || params.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const wallet = await this.getOrCreateWallet(params.userId, db);

    await db.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: params.type || WalletTransactionType.DEPOSIT,
        amount: new Prisma.Decimal(params.amount),
        status: WalletTransactionStatus.COMPLETED,
        reference: params.reference,
      },
    });

    await this.syncWalletWithLedger(params.userId, db);
  }

  async initiateWalletFunding(params: {
    userId: string;
    amount: number;
    provider: PaymentProvider;
    providerRef?: string;
  }) {
    if (!params.amount || params.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const providerRef =
      params.providerRef?.trim() ||
      `WALLET-FUND-${params.provider}-${params.userId
        .slice(0, 6)
        .toUpperCase()}-${Date.now()}`;

    const existing = await this.prisma.walletTransaction.findFirst({
      where: { reference: providerRef },
    });

    if (existing) {
      throw new BadRequestException('Duplicate funding reference');
    }

    const wallet = await this.getOrCreateWallet(params.userId);

    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: WalletTransactionType.DEPOSIT,
        amount: new Prisma.Decimal(params.amount),
        status: WalletTransactionStatus.PENDING,
        reference: providerRef,
      },
    });

    return {
      message: 'Wallet funding initiated',
      provider: params.provider,
      providerRef,
      amount: params.amount,
      status: WalletTransactionStatus.PENDING,
      flutterwaveMeta: {
        walletUserId: params.userId,
        providerRef,
      },
      nextAction:
        'Complete payment via provider. Wallet will be credited after successful webhook verification.',
    };
  }

  async completeWalletFunding(params: {
    userId: string;
    amount: number;
    providerRef: string;
  }) {
    if (!params.userId) {
      throw new BadRequestException('userId is required');
    }

    if (!params.providerRef?.trim()) {
      throw new BadRequestException('providerRef is required');
    }

    if (!params.amount || params.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    return this.prisma.$transaction(async (tx) => {
      const wallet = await this.getOrCreateWallet(params.userId, tx);

      const existingTx = await tx.walletTransaction.findFirst({
        where: {
          walletId: wallet.id,
          reference: params.providerRef,
        },
      });

      if (existingTx?.status === WalletTransactionStatus.COMPLETED) {
        return {
          message: 'Wallet funding already completed',
          reference: params.providerRef,
          duplicate: true,
        };
      }

      if (
        existingTx &&
        Number(existingTx.amount) !== Number(params.amount)
      ) {
        throw new BadRequestException('Wallet funding amount mismatch');
      }

      const userAccount = await this.getOrCreateUserAccount(params.userId, tx);
      const platformAccount = await this.getOrCreatePlatformAccount(tx);

      const existingLedger = await tx.ledgerEntry.findFirst({
        where: {
          reference: params.providerRef,
          accountId: userAccount.id,
        },
      });

      if (!existingLedger) {
        await this.ledger.recordDoubleEntry({
          debitAccountId: platformAccount.id,
          creditAccountId: userAccount.id,
          amount: params.amount,
          source: LedgerSource.EXTERNAL_FUNDING,
          reference: params.providerRef,
          tx,
        });
      }

      if (existingTx) {
        await tx.walletTransaction.update({
          where: { id: existingTx.id },
          data: {
            status: WalletTransactionStatus.COMPLETED,
          },
        });
      } else {
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: WalletTransactionType.DEPOSIT,
            amount: new Prisma.Decimal(params.amount),
            status: WalletTransactionStatus.COMPLETED,
            reference: params.providerRef,
          },
        });
      }

      await this.syncWalletWithLedger(params.userId, tx);

      return {
        message: 'Wallet funded successfully',
        reference: params.providerRef,
      };
    });
  }

  async fundWalletFromExternal(params: {
    userId: string;
    amount: number;
    reference?: string;
  }) {
    if (!params.amount || params.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const safeReference =
      params.reference?.trim() ||
      `EXT-${params.userId.slice(0, 6).toUpperCase()}-${Date.now()}`;

    return this.prisma.$transaction(async (tx) => {
      const userAccount = await this.getOrCreateUserAccount(params.userId, tx);
      const platformAccount = await this.getOrCreatePlatformAccount(tx);

      await this.ledger.recordDoubleEntry({
        debitAccountId: platformAccount.id,
        creditAccountId: userAccount.id,
        amount: params.amount,
        source: LedgerSource.EXTERNAL_FUNDING,
        reference: safeReference,
        tx,
      });

      await this.creditWallet({
        userId: params.userId,
        amount: params.amount,
        reference: safeReference,
        type: WalletTransactionType.DEPOSIT,
        tx,
      });

      return {
        message: 'Wallet funded successfully',
        reference: safeReference,
      };
    });
  }

  async requestWithdrawal(userId: string, input: RequestWithdrawalInput) {
    if (!input.amount || input.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const method = this.validateWithdrawalDestination(input);
    const balance = await this.getUserBalance(userId);

    if (balance < input.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const wallet = await this.getOrCreateWallet(userId);

    return this.prisma.withdrawalRequest.create({
      data: {
        investorId: userId,
        walletId: wallet.id,
        amount: input.amount,
        method,
        phoneNumber: input.phoneNumber?.trim() ?? null,
        bankName: input.bankName?.trim() ?? null,
        accountName: input.accountName?.trim() ?? null,
        accountNumber: input.accountNumber?.trim() ?? null,
        cardLast4: input.cardLast4?.trim() ?? null,
        status: WithdrawalStatus.PENDING,
      },
    });
  }

  async approveWithdrawal(requestId: string) {
    const request = await this.prisma.withdrawalRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new BadRequestException('Request not found');

    if (request.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('Only pending withdrawals can be approved');
    }

    this.validateSavedWithdrawalDestination(request);

    return this.prisma.withdrawalRequest.update({
      where: { id: requestId },
      data: {
        status: WithdrawalStatus.APPROVED,
        approvedAt: new Date(),
      },
    });
  }

  async processApprovedWithdrawal(requestId: string) {
    const request = await this.prisma.withdrawalRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new BadRequestException('Request not found');

    if (request.status !== WithdrawalStatus.APPROVED) {
      throw new BadRequestException('Only approved withdrawals can be processed');
    }

    this.validateSavedWithdrawalDestination(request);

    return this.prisma.withdrawalRequest.update({
      where: { id: requestId },
      data: {
        status: WithdrawalStatus.PROCESSING,
        processingAt: new Date(),
      },
    });
  }

  async completeWithdrawal(requestId: string, _manualReference?: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.withdrawalRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) throw new BadRequestException('Request not found');

      if (
        request.status !== WithdrawalStatus.APPROVED &&
        request.status !== WithdrawalStatus.PROCESSING
      ) {
        throw new BadRequestException(
          'Only approved or processing withdrawals can be completed',
        );
      }

      this.validateSavedWithdrawalDestination(request);

      const payout = await this.payoutService.sendPayout({
        withdrawalId: request.id,
        amount: request.amount,
        method: request.method,
        phoneNumber: request.phoneNumber,
        bankName: request.bankName,
        accountName: request.accountName,
        accountNumber: request.accountNumber,
        cardLast4: request.cardLast4,
      });

      if (!payout.success || !payout.reference) {
        throw new BadRequestException('Payout failed');
      }

      const investorAccount = await this.getOrCreateUserAccount(
        request.investorId,
        tx,
      );
      const platformAccount = await this.getOrCreatePlatformAccount(tx);

      const internalReference = `ZYR-WD-${request.id.slice(0, 8).toUpperCase()}`;
      const reference = `${internalReference}-${payout.reference}`;

      await this.ledger.recordDoubleEntry({
        debitAccountId: investorAccount.id,
        creditAccountId: platformAccount.id,
        amount: request.amount,
        source: LedgerSource.WITHDRAWAL,
        reference,
        tx,
      });

      await tx.walletTransaction.create({
        data: {
          walletId: request.walletId,
          type: WalletTransactionType.WITHDRAWAL,
          amount: new Prisma.Decimal(request.amount),
          status: WalletTransactionStatus.COMPLETED,
          reference,
        },
      });

      await this.syncWalletWithLedger(request.investorId, tx);

      return tx.withdrawalRequest.update({
        where: { id: requestId },
        data: {
          status: WithdrawalStatus.COMPLETED,
          payoutReference: payout.reference,
          completedAt: new Date(),
        },
      });
    });
  }

  async failWithdrawal(requestId: string, reason?: string) {
    const request = await this.prisma.withdrawalRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new BadRequestException('Request not found');

    if (
      request.status === WithdrawalStatus.COMPLETED ||
      request.status === WithdrawalStatus.REJECTED
    ) {
      throw new BadRequestException('This withdrawal can no longer be failed');
    }

    return this.prisma.withdrawalRequest.update({
      where: { id: requestId },
      data: {
        status: WithdrawalStatus.FAILED,
        failureReason: reason?.trim() || 'Payout failed',
        failedAt: new Date(),
      },
    });
  }

  async rejectWithdrawal(requestId: string, reason?: string) {
    const request = await this.prisma.withdrawalRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new BadRequestException('Request not found');

    if (request.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('Only pending withdrawals can be rejected');
    }

    return this.prisma.withdrawalRequest.update({
      where: { id: requestId },
      data: {
        status: WithdrawalStatus.REJECTED,
        failureReason: reason?.trim() || 'Rejected by admin',
        rejectedAt: new Date(),
      },
    });
  }

  async getWithdrawalRequests() {
    return this.prisma.withdrawalRequest.findMany({
      include: {
        investor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private getWalletRef(walletId: string) {
    return `ZYR-WLT-${walletId.slice(0, 6).toUpperCase()}`;
  }

  private mapLedgerSource(source: string) {
    switch (source) {
      case LedgerSource.EXTERNAL_FUNDING:
        return { title: 'Wallet Top Up', subtitle: 'External Funding' };
      case LedgerSource.PROFIT_DISTRIBUTION:
        return { title: 'Profit Distribution', subtitle: 'Investment Profit' };
      case LedgerSource.WITHDRAWAL:
        return { title: 'Wallet Withdrawal', subtitle: 'Completed Payout' };
      case LedgerSource.INVESTMENT:
        return { title: 'Investment Payment', subtitle: 'Property Investment' };
      case LedgerSource.REFUND:
        return { title: 'Refund', subtitle: 'Refund Credit' };
      case LedgerSource.RENT_PAYMENT:
        return { title: 'Rent Payment', subtitle: 'Monthly Rent' };
      case LedgerSource.SERVICE_CHARGE_PAYMENT:
        return {
          title: 'Service Charge Payment',
          subtitle: 'Building Service Fee',
        };
      case LedgerSource.GARBAGE_PAYMENT:
        return { title: 'Garbage Fee Payment', subtitle: 'Waste Collection' };
      case LedgerSource.MAINTENANCE_PAYMENT:
        return {
          title: 'Maintenance Payment',
          subtitle: 'Repair / Service Work',
        };
      case LedgerSource.OTHER_FEE_PAYMENT:
        return { title: 'Other Fee Payment', subtitle: 'Additional Charges' };
      case LedgerSource.EXPENSE_PAYMENT:
        return { title: 'Expense Payment', subtitle: 'Property Expense' };
      default:
        return { title: source.replace(/_/g, ' '), subtitle: 'Wallet Activity' };
    }
  }

  private async buildCombinedTransactions(
    userId: string,
  ): Promise<WalletTransactionListItem[]> {
    const account = await this.prisma.account.findFirst({
      where: { userId, type: AccountType.USER },
    });

    if (!account) return [];

    const ledgerEntries = await this.prisma.ledgerEntry.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'desc' },
      include: { property: true },
    });

    return ledgerEntries.map((entry) => {
      const isCredit = Number(entry.credit ?? 0) > 0;
      const amount = isCredit
        ? Number(entry.credit ?? 0)
        : Number(entry.debit ?? 0);
      const mapped = this.mapLedgerSource(entry.source);

      return {
        id: `ledger-${entry.id}`,
        title: mapped.title,
        subtitle: entry.property?.title || mapped.subtitle,
        time: entry.createdAt.toISOString(),
        amount,
        direction: isCredit ? 'positive' : 'negative',
        status: 'COMPLETED',
        reference: entry.reference || '',
      };
    });
  }

  async getWalletTransactions(userId: string, page = 1, limit = 10) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));

    const combined = await this.buildCombinedTransactions(userId);
    const total = combined.length;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const start = (safePage - 1) * safeLimit;
    const end = start + safeLimit;

    return {
      items: combined.slice(start, end),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    };
  }

  async getWalletSummary(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    const balance = await this.getUserBalance(userId);

    const account = await this.prisma.account.findFirst({
      where: { userId, type: AccountType.USER },
    });

    let totalInflow = 0;
    let totalOutflow = 0;

    if (account) {
      const entries = await this.prisma.ledgerEntry.findMany({
        where: { accountId: account.id },
      });

      for (const entry of entries) {
        totalInflow += Number(entry.credit ?? 0);
        totalOutflow += Number(entry.debit ?? 0);
      }
    }

    const totalInvestmentAgg = await this.prisma.investment.aggregate({
      where: { investorId: userId },
      _sum: { amount: true },
    });

    const totalProfitAgg = await this.prisma.profitDistribution.aggregate({
      where: { investorId: userId },
      _sum: { amount: true },
    });

    const pendingWithdrawalAgg = await this.prisma.withdrawalRequest.aggregate({
      where: {
        investorId: userId,
        status: {
          in: [
            WithdrawalStatus.PENDING,
            WithdrawalStatus.APPROVED,
            WithdrawalStatus.PROCESSING,
          ],
        },
      },
      _sum: { amount: true },
    });

    const transactions = await this.getWalletTransactions(userId, 1, 10);

    return {
      balance,
      walletRef: this.getWalletRef(wallet.id),
      accountType: 'Primary',
      currency: 'UGX',
      monthlyGrowth: 12.4,
      totalInflow,
      totalOutflow,
      totalInvestment: Number(totalInvestmentAgg._sum.amount ?? 0),
      totalProfit: Number(totalProfitAgg._sum.amount ?? 0),
      pendingWithdrawal: Number(pendingWithdrawalAgg._sum.amount ?? 0),
      walletStatus: 'Active',
      recentTransactions: transactions.items,
    };
  }
}