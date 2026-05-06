import { IsString, IsNotEmpty } from 'class-validator';

export class TransferResidentDto {
  @IsString()
  @IsNotEmpty()
  newUnitId!: string; 
}