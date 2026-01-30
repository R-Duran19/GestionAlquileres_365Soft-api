import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterAdminDto {
  // Datos del Tenant
  @IsString()
  company_name: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  // Datos del Usuario Admin
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
