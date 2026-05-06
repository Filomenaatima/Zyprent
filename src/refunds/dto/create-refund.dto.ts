import { IsNumber, IsString, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateRefundDto {
  @IsUUID()
  accountId!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  reference?: string;
}
