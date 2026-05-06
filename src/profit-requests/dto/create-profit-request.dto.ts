import { IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProfitRequestDto {
  @IsUUID()
  propertyId!: string;

  @Type(() => Number) 
  @IsNumber()
  @Min(1)
  amount!: number;
}