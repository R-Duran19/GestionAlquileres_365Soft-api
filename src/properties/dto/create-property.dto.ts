import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  Max,
  IsEnum,
  IsBoolean,
  IsEmail,
} from 'class-validator';

// DTO para crear dirección
export class CreatePropertyAddressDto {
  @IsEnum(['address_1', 'address_2', 'address_3'])
  address_type: 'address_1' | 'address_2' | 'address_3';

  @IsString()
  @IsNotEmpty()
  street_address: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zip_code?: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}

// DTO para crear dueño (si no existe)
export class CreateRentalOwnerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsBoolean()
  is_company?: boolean;

  @IsEmail()
  @IsNotEmpty()
  primary_email: string;

  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @IsOptional()
  @IsEmail()
  secondary_email?: string;

  @IsOptional()
  @IsString()
  secondary_phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// DTO para asignar dueño existente
export class AssignOwnerDto {
  @IsNumber()
  rental_owner_id: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  ownership_percentage?: number;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}

// DTO principal para crear propiedad
export class CreatePropertyDto {
  // Basic Info (mínimo requerido)
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @IsNotEmpty()
  property_type_id: number;

  @IsNumber()
  @IsNotEmpty()
  property_subtype_id: number;

  // Addresses (mínimo 1 requerido)
  @IsArray()
  @IsNotEmpty()
  addresses: CreatePropertyAddressDto[];

  // Owners (opcional, puede ser array de dueños nuevos o existentes)
  @IsArray()
  @IsOptional()
  existing_owners?: AssignOwnerDto[]; // IDs de dueños existentes

  @IsArray()
  @IsOptional()
  new_owners?: CreateRentalOwnerDto[]; // Crear nuevos dueños

  // Optional fields
  @IsOptional()
  @IsString()
  description?: string;

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
}
