import { IsEnum, IsNumber, IsString } from 'class-validator';
import { PaymentChannel, PaymentProvider } from '@prisma/client';

export class CreatePaymentDto {
  @IsString()
  invoiceId!: string;

  @IsNumber()
  amount!: number;

  @IsEnum(PaymentChannel)
  channel!: PaymentChannel;

  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;

  @IsString()
  providerRef!: string;
}