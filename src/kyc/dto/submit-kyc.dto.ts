import { IsString, IsDateString } from 'class-validator';

export class SubmitKycDto {
  @IsString()
  fullName!: string;

  @IsDateString()
  dateOfBirth!: string;

  @IsString()
  nationality!: string;

  @IsString()
  address!: string;

  @IsString()
  idType!: string;

  @IsString()
  idNumber!: string;

  @IsString()
  documentUrl!: string;
}