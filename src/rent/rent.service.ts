import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  async createInvoice(dto: {
    rentContractId: string;
    residentId: string;
    unitId: string;
    period: string;
    dueDate: Date;
    totalAmount: number;
  }) {
    const invoice = await this.prisma.rentInvoice.create({
      data: {
        rentContractId: dto.rentContractId,
        residentId: dto.residentId,
        unitId: dto.unitId,
        period: dto.period,
        dueDate: dto.dueDate,

        totalAmount: new Prisma.Decimal(dto.totalAmount),
        paidAmount: new Prisma.Decimal(0),
      },
    });

    return invoice;
  }

  async recordPayment(params: {
    invoiceId: string;
    amount: number;
    channel: any;
    provider: any;
    providerRef: string;
  }) {
    return this.prisma.payment.create({
      data: {
        amount: new Prisma.Decimal(params.amount),
        channel: params.channel,
        provider: params.provider,
        providerRef: params.providerRef,
        status: 'SUCCESS',
        invoiceId: params.invoiceId,
      },
    });
  }

  async getLedger(accountId: string) {
    return this.ledger.getAccountLedger(accountId);
  }
}