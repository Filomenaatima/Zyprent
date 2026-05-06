import { IsEnum } from 'class-validator';

export enum ExportReportType {
  PROPERTY_INCOME = 'PROPERTY_INCOME',
  MANAGER_SUMMARY = 'MANAGER_SUMMARY',
  INVESTOR_INCOME = 'INVESTOR_INCOME',
}

export class ExportReportDto {
  @IsEnum(ExportReportType)
  type!: ExportReportType;
}