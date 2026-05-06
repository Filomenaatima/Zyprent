import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  title!: string;

  @IsString()
  location!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  phase?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;

  @IsOptional()
  @IsString()
  managerId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  serviceChargeAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  garbageFeeAmount?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}