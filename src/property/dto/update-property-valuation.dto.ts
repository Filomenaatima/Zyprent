import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdatePropertyValuationDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  marketValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  marketPricePerShare?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(1)
  valuationCapRate?: number;
}