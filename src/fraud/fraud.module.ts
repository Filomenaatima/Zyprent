import { Module } from '@nestjs/common';
import { FraudService } from './fraud.service';
import { FraudEngine } from './fraud.engine';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FraudService, FraudEngine],
  exports: [FraudService],
})
export class FraudModule {}