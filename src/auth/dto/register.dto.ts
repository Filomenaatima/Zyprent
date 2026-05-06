import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(['MANAGER', 'INVESTOR', 'RESIDENT', 'SERVICE_PROVIDER'])
  role!: 'MANAGER' | 'INVESTOR' | 'RESIDENT' | 'SERVICE_PROVIDER';
}