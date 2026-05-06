import { IsString, IsNumber, Min } from 'class-validator';

export class BuyListedSharesDto {

  @IsString()
  listingId!: string;

  @IsString()
  buyerId!: string;

  @IsNumber()
  @Min(1)
  shares!: number;

}