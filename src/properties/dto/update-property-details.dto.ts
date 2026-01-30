import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  Max,
  IsEnum,
  IsBoolean,
} from 'class-validator';

export class UpdatePropertyDetailsDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  amenities?: string[];

  @IsOptional()
  @IsArray()
  included_items?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  security_deposit_amount?: number;

  @IsOptional()
  @IsEnum(['DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO', 'RESERVADO', 'INACTIVO'])
  status?: string;

  @IsOptional()
  @IsString()
  account_number?: string;

  @IsOptional()
  @IsString()
  account_type?: string;

  @IsOptional()
  @IsString()
  account_holder_name?: string;
}
