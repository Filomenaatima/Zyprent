import { IsInt, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateUnitDto {
  @IsString()
  @IsNotEmpty()
  number!: string;

  @IsInt()
  rentAmount!: number;

  @IsUUID()
  propertyId!: string;
}
