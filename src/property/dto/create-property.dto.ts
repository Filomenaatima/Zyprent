import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  title!: string;

  @IsString()
  location!: string;

  // 🔥 REQUIRED: total units in the building (source of truth)
  @IsInt()
  @Min(1)
  totalUnits!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  serviceChargeAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  garbageFeeAmount?: number;
}