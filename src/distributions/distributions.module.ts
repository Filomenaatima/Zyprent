import { Module } from '@nestjs/common';
import { DistributionsService } from './distributions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [PrismaModule, LedgerModule],
  providers: [DistributionsService],
  exports: [DistributionsService],
})
export class DistributionsModule {}