import { IsNumber, IsString, Min } from 'class-validator';

export class CreatePayoutDto {
  @IsString()
  accountId!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsString()
  currency!: string;

  @IsString()
  narration!: string;
}