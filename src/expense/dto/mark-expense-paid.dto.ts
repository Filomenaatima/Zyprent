import { IsOptional, IsString } from 'class-validator';

export class MarkExpensePaidDto {
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}