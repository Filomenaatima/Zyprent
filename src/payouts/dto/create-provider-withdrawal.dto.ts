import { IsNumber, Min } from 'class-validator';

export class CreateProviderWithdrawalDto {
  @IsNumber()
  @Min(1)
  amount!: number;
}