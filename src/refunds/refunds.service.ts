import { Injectable } from '@nestjs/common';
import { LedgerService } from '../ledger/ledger.service';
import { LedgerSource } from '@prisma/client';

@Injectable()
export class RefundsService {
  constructor(private readonly ledger: LedgerService) {}

  async createRefund(dto: {
    accountId: string;
    amount: number;
    reference?: string;
  }) {
    return this.ledger.creditAccount({
      accountId: dto.accountId,
      amount: dto.amount,
      source: LedgerSource.REFUND,
      reference: dto.reference,
    });
  }
}
