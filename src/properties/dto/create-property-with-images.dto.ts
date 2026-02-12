import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CreatePropertyAddressDto, AssignOwnerDto, CreateRentalOwnerDto } from './create-property.dto';

/**
 * DTO para crear propiedad con imágenes
 * Se usa con multipart/form-data
 * Los campos complejos (arrays, objetos) se deben enviar como JSON strings
 */
export class CreatePropertyWithImagesDto {
  // ====== Basic Info ======
  @IsString()
  @IsNotEmpty()
  title: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  property_type_id: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  property_subtype_id: number;

  @IsOptional()
  @IsString()
  description?: string;

  // ====== Pricing (Nuevo - Crítico) ======
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return Number(value);
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthly_rent?: number;

  @IsOptional()
  @IsString()
  currency?: string; // BOB, USD, EUR, etc.

  // ====== Characteristics (Nuevo) ======
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return Number(value);
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  square_meters?: number;

  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return Number(value);
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return Number(value);
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return Number(value);
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  parking_spaces?: number;

  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return Number(value);
  })
  @IsOptional()
  @IsNumber()
  @Min(1800)
  year_built?: number;

  @Transform(({ value }) => {
    if (value === '' || value === 'false') return false;
    if (value === 'true') return true;
    return Boolean(value);
  })
  @IsOptional()
  is_furnished?: boolean;

  // ====== Property Rules (Nuevo) ======
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return undefined;
      }
    }
    return value;
  })
  @IsOptional()
  property_rules?: {
    pets_allowed?: boolean;
    pet_types?: string[];
    pet_deposit?: number;
    smoking_allowed?: boolean;
    max_occupants?: number;
  };

  // ====== Addresses (enviar como JSON string) ======
  // Ejemplo: addresses='[{"address_type":"address_1","street_address":"Calle 123","city":"La Paz","country":"Bolivia"}]'
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreatePropertyAddressDto)
  addresses: CreatePropertyAddressDto[];

  // ====== Owners (enviar como JSON string si se usa) ======
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AssignOwnerDto)
  existing_owners?: AssignOwnerDto[];

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateRentalOwnerDto)
  new_owners?: CreateRentalOwnerDto[];

  // ====== Optional Fields ======
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return Number(value);
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  security_deposit_amount?: number;

  @IsOptional()
  @IsString()
  account_number?: string;

  @IsOptional()
  @IsString()
  account_type?: string;

  @IsOptional()
  @IsString()
  account_holder_name?: string;

  // ====== Amenities & Included Items (enviar como JSON string) ======
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return value || [];
  })
  @IsArray()
  @IsOptional()
  amenities?: string[];

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return value || [];
  })
  @IsArray()
  @IsOptional()
  included_items?: string[];

  // ====== Location (optional for initial creation) ======
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return Number(value);
  })
  @IsOptional()
  @IsNumber()
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90, { message: 'Latitude must be between -90 and 90' })
  latitude?: number;

  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return Number(value);
  })
  @IsOptional()
  @IsNumber()
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180, { message: 'Longitude must be between -180 and 180' })
  longitude?: number;

  // Nota: Las imágenes se manejan separadamente como archivos en el controller
  // usando @UploadedFiles() decorator
}
