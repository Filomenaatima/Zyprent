import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ValuationService } from './valuation.service';
import { ValuationController } from './valuation.controller';

@Module({
  imports: [PrismaModule],
  providers: [ValuationService],
  controllers: [ValuationController],
  exports: [ValuationService],
})
export class ValuationModule {}