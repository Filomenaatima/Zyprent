import { Module } from '@nestjs/common';
import { ProfitDistributionsController } from './profit-distributions.controller';
import { ProfitDistributionsService } from './profit-distributions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ProfitDistributionsController],
  providers: [ProfitDistributionsService],
  exports: [ProfitDistributionsService],
})
export class ProfitDistributionsModule {}