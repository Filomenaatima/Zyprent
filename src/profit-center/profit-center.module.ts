import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfitModule } from '../profits/profit.module';
import { ProfitDistributionsModule } from '../profit-distributions/profit-distributions.module';
import { ValuationModule } from '../valuation/valuation.module';
import { FinanceModule } from '../finance/finance.module';
import { ProfitCenterController } from './profit-center.controller';
import { ProfitCenterService } from './profit-center.service';

@Module({
  imports: [
    PrismaModule,
    ProfitModule,
    ProfitDistributionsModule,
    ValuationModule,
    FinanceModule,
  ],
  controllers: [ProfitCenterController],
  providers: [ProfitCenterService],
})
export class ProfitCenterModule {}