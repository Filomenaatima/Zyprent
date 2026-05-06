import {
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ReportRunStatus, ReportType } from '@prisma/client';

export class ReportHistoryQueryDto {
  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @IsOptional()
  @IsEnum(ReportRunStatus)
  status?: ReportRunStatus;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}