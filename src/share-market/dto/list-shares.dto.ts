import { IsString, IsNumber, Min } from 'class-validator';

export class ListSharesDto {

  @IsString()
  investorId!: string;

  @IsString()
  propertyId!: string;

  @IsNumber()
  @Min(1)
  shares!: number;

  @IsNumber()
  @Min(1)
  pricePerShare!: number;

}