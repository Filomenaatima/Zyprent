import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DispatchService } from './dispatch.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { LedgerModule } from '../ledger/ledger.module';
import { MaintenanceAnalyticsService } from './maintenance-analytics.service';
import { DiagnosisService } from './diagnosis.service';
import { ExpenseModule } from '../expense/expense.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    LedgerModule,
    ExpenseModule,
  ],
  providers: [
    MaintenanceService,
    DispatchService,
    MaintenanceAnalyticsService,
    DiagnosisService,
  ],
  controllers: [MaintenanceController],
  exports: [
    MaintenanceService,
    MaintenanceAnalyticsService,
    DiagnosisService,
  ],
})
export class MaintenanceModule {}