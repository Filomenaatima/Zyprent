import { Module } from '@nestjs/common';
import { StatementsController } from './statements.controller';
import { StatementService } from './statements.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StatementsController],
  providers: [StatementService],
})
export class StatementsModule {}
