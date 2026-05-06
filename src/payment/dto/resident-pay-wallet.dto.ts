import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ResidentPayWalletDto {
  @IsString()
  invoiceId!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;
}