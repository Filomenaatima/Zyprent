import { Injectable, BadRequestException } from '@nestjs/common';
import { AccountType, LedgerSource, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  async recordDoubleEntry(params: {
    debitAccountId: string;
    creditAccountId: string;
    amount: number;
    source: LedgerSource;
    reference?: string;
    propertyId?: string;
    rentInvoiceId?: string;
    paymentId?: string;
    payoutId?: string;
    tx?: Prisma.TransactionClient;
  }) {
    if (!params.amount || params.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    if (params.debitAccountId === params.creditAccountId) {
      throw new BadRequestException(
        'Debit and credit accounts cannot be the same',
      );
    }

    const amount = new Prisma.Decimal(params.amount);

    const execute = async (db: Prisma.TransactionClient) => {
      const [debitAccount, creditAccount] = await Promise.all([
        db.account.findUnique({
          where: { id: params.debitAccountId },
        }),
        db.account.findUnique({
          where: { id: params.creditAccountId },
        }),
      ]);

      if (!debitAccount) {
        throw new BadRequestException('Debit account not found');
      }

      if (!creditAccount) {
        throw new BadRequestException('Credit account not found');
      }

      const debitCanGoNegative = debitAccount.type === AccountType.PLATFORM;

      if (!debitCanGoNegative && debitAccount.balance.lt(amount)) {
        throw new BadRequestException('Insufficient balance');
      }

      const debitEntry = await db.ledgerEntry.create({
        data: {
          accountId: params.debitAccountId,
          debit: amount,
          credit: new Prisma.Decimal(0),
          source: params.source,
          reference: params.reference,
          propertyId: params.propertyId,
          rentInvoiceId: params.rentInvoiceId,
          paymentId: params.paymentId,
          payoutId: params.payoutId,
        },
      });

      const creditEntry = await db.ledgerEntry.create({
        data: {
          accountId: params.creditAccountId,
          debit: new Prisma.Decimal(0),
          credit: amount,
          source: params.source,
          reference: params.reference,
          propertyId: params.propertyId,
          rentInvoiceId: params.rentInvoiceId,
          paymentId: params.paymentId,
          payoutId: params.payoutId,
        },
      });

      await db.account.update({
        where: { id: params.debitAccountId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      await db.account.update({
        where: { id: params.creditAccountId },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      return {
        debitEntry,
        creditEntry,
      };
    };

    if (params.tx) {
      return execute(params.tx);
    }

    return this.prisma.$transaction(execute);
  }

  async getBalance(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new BadRequestException('Account not found');
    }

    return account.balance;
  }

  async getAccountLedger(accountId: string) {
    return this.prisma.ledgerEntry.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPropertyLedger(propertyId: string) {
    return this.prisma.ledgerEntry.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async trialBalance() {
    const entries = await this.prisma.ledgerEntry.findMany();

    let totalDebit = new Prisma.Decimal(0);
    let totalCredit = new Prisma.Decimal(0);

    for (const entry of entries) {
      totalDebit = totalDebit.plus(entry.debit);
      totalCredit = totalCredit.plus(entry.credit);
    }

    return {
      totalDebit: totalDebit.toNumber(),
      totalCredit: totalCredit.toNumber(),
      balanced: totalDebit.equals(totalCredit),
    };
  }

    async creditAccount(_params?: unknown) {
    throw new BadRequestException(
      'creditAccount is disabled. Use recordDoubleEntry instead.',
    );
  }

  async debitAccount(_params?: unknown) {
    throw new BadRequestException(
      'debitAccount is disabled. Use recordDoubleEntry instead.',
    );
  }
}