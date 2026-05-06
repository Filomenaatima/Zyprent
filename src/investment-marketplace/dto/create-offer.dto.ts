import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateOfferDto {

  @IsString()
  propertyId!: string;

  @IsNumber()
  totalShares!: number;

  @IsNumber()
  pricePerShare!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

}