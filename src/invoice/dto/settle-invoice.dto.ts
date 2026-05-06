import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { PaymentChannel, PaymentProvider } from '@prisma/client';

export class SettleInvoiceDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsEnum(PaymentChannel)
  channel!: PaymentChannel;

  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;

  @IsString()
  providerRef!: string;
}