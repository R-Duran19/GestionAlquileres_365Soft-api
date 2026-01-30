import {
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FilterPropertiesDto {
  @IsOptional()
  @IsEnum(['DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO', 'RESERVADO', 'INACTIVO'])
  status?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  property_type_id?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  property_subtype_id?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  search?: string; // Busca en título y descripción

  @IsOptional()
  @IsEnum(['created_at', 'updated_at', 'title'])
  sort_by?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
