import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [FinanceService, PrismaService],
  controllers: [FinanceController],
  exports: [FinanceService],
})
export class FinanceModule {}