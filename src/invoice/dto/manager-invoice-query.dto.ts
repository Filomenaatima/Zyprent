import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ManagerInvoiceQueryDto {
  @IsOptional()
  @IsIn(['ALL', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'])
  status?: 'ALL' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}