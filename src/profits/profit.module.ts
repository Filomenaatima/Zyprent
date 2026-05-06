import { Module } from '@nestjs/common';
import { ProfitService } from './profit.service';
import { ProfitController } from './profit.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ProfitController],
  providers: [ProfitService, PrismaService],
  exports: [ProfitService],
})
export class ProfitModule {}