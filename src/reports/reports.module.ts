import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportsService } from './reports.service';
import { ReportRunnerService } from './report-runner.service';
import { ReportCronProcessor } from './report-cron.processor';
import { ReportsController } from './reports.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    ReportsService,
    ReportRunnerService,
    ReportCronProcessor,
    PrismaService,
  ],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}