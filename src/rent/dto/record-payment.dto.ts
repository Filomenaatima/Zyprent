export class RecordPaymentDto {
  invoiceId!: string;
  amount!: number;
  reference?: string;
}
