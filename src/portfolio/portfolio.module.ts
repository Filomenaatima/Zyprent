import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ValuationModule } from '../valuation/valuation.module';

@Module({
  imports: [PrismaModule, ValuationModule],
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}