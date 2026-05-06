import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsEmail,
} from 'class-validator';
import { ServiceProviderType } from '@prisma/client';

export class CreateProviderDto {
  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsEnum(ServiceProviderType)
  type!: ServiceProviderType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  city?: string;
}