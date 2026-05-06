import { Module } from '@nestjs/common';
import { ProfitDistributionJob } from './profit-distribution.job';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [PrismaModule, WalletModule],
  providers: [ProfitDistributionJob],
})
export class JobsModule {}