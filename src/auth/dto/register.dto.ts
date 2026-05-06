import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(['ADMIN', 'MANAGER', 'INVESTOR', 'RESIDENT'])
  role!: 'ADMIN' | 'MANAGER' | 'INVESTOR' | 'RESIDENT';
}
