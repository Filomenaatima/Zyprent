import { Module } from '@nestjs/common';
import { InvestmentMarketplaceService } from './investment-marketplace.service';
import { InvestmentMarketplaceController } from './investment-marketplace.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [PrismaModule, LedgerModule],
  controllers: [InvestmentMarketplaceController],
  providers: [InvestmentMarketplaceService],
})
export class InvestmentMarketplaceModule {}