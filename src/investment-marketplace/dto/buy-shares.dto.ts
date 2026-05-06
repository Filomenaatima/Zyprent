import { IsString, IsNumber, Min } from 'class-validator';

export class BuySharesDto {

  @IsString()
  investorId!: string;

  @IsString()
  propertyId!: string;

  @IsNumber()
  @Min(1)
  shares!: number;

}