import { Injectable, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PrismaService } from '../prisma/prisma.service';
import { ReportRunnerService } from './report-runner.service';
import { ReportRunStatus } from '@prisma/client';

@Injectable()
export class ReportCronProcessor implements OnModuleInit {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly prisma: PrismaService,
    private readonly reportRunnerService: ReportRunnerService,
  ) {}

  async onModuleInit() {
    await this.loadSchedules();
  }

  async loadSchedules() {
    // ✅ REMOVE isActive filter (it does not exist in your schema)
    const schedules = await this.prisma.scheduledReport.findMany();

    for (const schedule of schedules) {
      this.registerCronJob(schedule);
    }
  }

  registerCronJob(schedule: any) {
    const job = new CronJob(schedule.cron, async () => {
      console.log(`Running scheduled report: ${schedule.type}`);

      // ✅ Create ReportRun entry first
      const reportRun = await this.prisma.reportRun.create({
        data: {
          type: schedule.type,
          scheduleId: schedule.id,
          executedBy: schedule.createdBy, // system runs as creator
          status: ReportRunStatus.PENDING,
        },
      });

      try {
        // ✅ Call your existing run() method correctly
        const result = await this.reportRunnerService.run(
          schedule.type,
          {
            userId: schedule.createdBy,
            role: 'SYSTEM',
          },
        );

        // ✅ Update ReportRun with success
        await this.prisma.reportRun.update({
          where: { id: reportRun.id },
          data: {
            status: ReportRunStatus.SUCCESS,
            output: result,
          },
        });

        console.log(`Report completed: ${schedule.type}`);
      } catch (error: any) {
        // ❌ Update ReportRun with failure
        await this.prisma.reportRun.update({
          where: { id: reportRun.id },
          data: {
            status: ReportRunStatus.FAILED,
            error: error.message,
          },
        });

        console.error(`Report failed: ${schedule.type}`, error);
      }
    });

    this.schedulerRegistry.addCronJob(`schedule-${schedule.id}`, job);
    job.start();
  }
}