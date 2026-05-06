import { Module } from '@nestjs/common';
import { InvestmentService } from './investment.service';
import { InvestmentController } from './investment.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ProfitScheduler } from '../schedule/profit.scheduler';

@Module({
  controllers: [InvestmentController],
  providers: [InvestmentService, ProfitScheduler, PrismaService],
  exports: [InvestmentService],
})
export class InvestmentModule {}