import { Module } from '@nestjs/common';
import { RentService } from './rent.service';
import { PrismaModule } from '../prisma/prisma.module';
import { InvoiceModule } from '../invoice/invoice.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [PrismaModule, InvoiceModule, LedgerModule],
  providers: [RentService],
  exports: [RentService],
})
export class RentModule {}
