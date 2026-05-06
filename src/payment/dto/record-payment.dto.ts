import { PaymentChannel, PaymentProvider } from '@prisma/client';

export class RecordPaymentDto {
  invoiceId!: string;
  amount!: number;
  channel!: PaymentChannel;
  provider!: PaymentProvider;
  providerRef!: string;
}
