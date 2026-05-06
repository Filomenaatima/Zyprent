import {
  IsUUID,
  IsNumber,
  IsString,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateQuoteDto {
  @IsUUID()
  requestId!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  laborCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  materialsCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedDurationHours?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}