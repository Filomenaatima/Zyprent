import { IsEnum, IsString, Matches } from 'class-validator';
import { ReportType } from '@prisma/client';

export class ScheduleReportDto {
  @IsEnum(ReportType)
  type!: ReportType;

  @IsString()
  @Matches(
    /^(\*|[0-5]?\d)\s+(\*|[01]?\d|2[0-3])\s+(\*|[1-9]|[12]\d|3[01])\s+(\*|[1-9]|1[0-2])\s+(\*|[0-6])$/,
    { message: 'Invalid cron expression' },
  )
  cron!: string;
}