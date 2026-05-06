import { Injectable, BadRequestException } from '@nestjs/common';
import { AccountType, LedgerSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';

@Injectable()
export class DistributionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  async distributeToInvestor(params: {
    investorAccountId: string;
    amount: number;
    reference?: string;
    propertyId: string;
  }) {
    if (params.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const propertyAccount = await this.prisma.account.findFirst({
      where: {
        propertyId: params.propertyId,
        type: AccountType.PROPERTY,
      },
    });

    if (!propertyAccount) {
      throw new BadRequestException('Property account not found');
    }

    const investorAccount = await this.prisma.account.findUnique({
      where: {
        id: params.investorAccountId,
      },
    });

    if (!investorAccount) {
      throw new BadRequestException('Investor account not found');
    }

    return this.ledger.recordDoubleEntry({
      debitAccountId: propertyAccount.id,
      creditAccountId: investorAccount.id,
      amount: params.amount,
      source: LedgerSource.PROFIT_DISTRIBUTION,
      reference: params.reference || `DIST-${params.propertyId}-${Date.now()}`,
      propertyId: params.propertyId,
    });
  }
}