import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportRunnerService } from './report-runner.service';
import { ReportType, ReportRunStatus, Role } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportRunnerService: ReportRunnerService,
  ) {}

  async runReport(
    type: ReportType,
    context: { userId: string; role: Role | string },
  ) {
    const run = await this.prisma.reportRun.create({
      data: {
        type,
        status: ReportRunStatus.PENDING,
        executedBy: context.userId,
      },
    });

    try {
      const output = await this.reportRunnerService.run(type, context);

      await this.prisma.reportRun.update({
        where: { id: run.id },
        data: {
          status: ReportRunStatus.SUCCESS,
          output,
        },
      });

      return output;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';

      await this.prisma.reportRun.update({
        where: { id: run.id },
        data: {
          status: ReportRunStatus.FAILED,
          error: message,
        },
      });

      throw error;
    }
  }

  async getReportHistory(filters?: {
    type?: ReportType;
    status?: ReportRunStatus;
    from?: string;
    to?: string;
  }) {
    return this.prisma.reportRun.findMany({
      where: {
        ...(filters?.type ? { type: filters.type } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.from || filters?.to
          ? {
              executedAt: {
                ...(filters.from ? { gte: new Date(filters.from) } : {}),
                ...(filters.to ? { lte: new Date(filters.to) } : {}),
              },
            }
          : {}),
      },
      include: {
        executor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        executedAt: 'desc',
      },
    });
  }
}