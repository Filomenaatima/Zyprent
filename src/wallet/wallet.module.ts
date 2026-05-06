import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';
import { WithdrawalPayoutService } from './withdrawal-payout.service';

@Module({
  imports: [PrismaModule, LedgerModule],
  providers: [WalletService, WithdrawalPayoutService],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}