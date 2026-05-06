import { IsString, IsNotEmpty } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  rentContractId!: string;
}
