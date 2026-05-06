import {
  IsUUID,
  IsNumber,
  IsDateString,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateRentContractDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  unitId!: string;

  @IsNumber()
  rentAmount!: number;

  @IsNumber()
  depositAmount!: number;

  @IsOptional()
  @IsNumber()
  serviceCharge?: number;

  @IsOptional()
  @IsNumber()
  garbageFee?: number;

  @IsInt()
  @Min(1)
  initialTermMonths!: number;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  billingAnchorDay?: number;

  @IsOptional()
  @IsDateString()
  nextBillingDate?: string;
}