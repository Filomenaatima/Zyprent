import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentChannel, PaymentProvider } from '@prisma/client';

export class ResidentInitiatePaymentDto {
  @IsString()
  invoiceId!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsEnum(PaymentChannel)
  channel!: PaymentChannel;

  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;

  @IsOptional()
  @IsString()
  providerRef?: string;
}