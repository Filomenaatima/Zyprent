import { Module } from '@nestjs/common';
import { ShareMarketService } from './share-market.service';
import { ShareMarketController } from './share-market.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [PrismaModule, LedgerModule],
  providers: [ShareMarketService],
  controllers: [ShareMarketController],
})
export class ShareMarketModule {}