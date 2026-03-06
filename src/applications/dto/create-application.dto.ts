import {
  IsNumber,
  IsString,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { Type } from 'class-transformer';

// Validador personalizado para Facebook (URL o username)
@ValidatorConstraint({ name: 'isFacebookValid', async: false })
class IsFacebookValidConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    if (!value) return true; // Es opcional

    // Validar URL de Facebook
    const facebookUrlRegex = /^https?:\/\/(www\.)?facebook\.com\/[\w\-\.]+(\/?|\/\?.+)$/i;
    if (facebookUrlRegex.test(value)) return true;

    // Validar username de Facebook (5+ caracteres)
    const usernameRegex = /^[\w\-\.]{5,}$/;
    if (usernameRegex.test(value)) return true;

    return false;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Facebook debe ser una URL válida o un nombre de usuario (mínimo 5 caracteres)';
  }
}

// Validador personalizado para Instagram (URL o username)
@ValidatorConstraint({ name: 'isInstagramValid', async: false })
class IsInstagramValidConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    if (!value) return true; // Es opcional

    // Validar URL de Instagram
    const instagramUrlRegex = /^https?:\/\/(www\.)?instagram\.com\/[\w\.]+(\/?|\/\?.+)$/i;
    if (instagramUrlRegex.test(value)) return true;

    // Validar username de Instagram (3+ caracteres)
    const usernameRegex = /^[\w\.]{3,}$/;
    if (usernameRegex.test(value)) return true;

    return false;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Instagram debe ser una URL válida o un nombre de usuario (mínimo 3 caracteres)';
  }
}

// Decorador para Facebook
function IsFacebookValid(validationOptions?: ValidationOptions) {
  return function (target: Object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsFacebookValidConstraint,
    });
  };
}

// Decorador para Instagram
function IsInstagramValid(validationOptions?: ValidationOptions) {
  return function (target: Object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsInstagramValidConstraint,
    });
  };
}

class SocialMediaDto {
  @IsOptional()
  @IsString({ message: 'Facebook debe ser un texto' })
  @IsFacebookValid()
  facebook?: string;

  @IsOptional()
  @IsString({ message: 'Instagram debe ser un texto' })
  @IsInstagramValid()
  instagram?: string;

  @IsOptional()
  @IsString()
  other?: string;
}

class PersonalDataDto {
  @IsString()
  full_name: string;

  @IsString()
  phone: string;

  @IsString()
  identity_document: string;

  @IsString()
  current_address: string;

  @IsOptional()
  @IsString()
  birth_date?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SocialMediaDto)
  social_media?: SocialMediaDto;
}

class EmploymentDataDto {
  @IsString()
  employer_name: string;

  @IsString()
  position: string;

  @IsNumber()
  monthly_income: number;

  @IsString()
  employment_duration: string;

  @IsString()
  employer_phone: string;
}

class RentalHistoryDto {
  @IsString()
  previous_address: string;

  @IsString()
  previous_landlord_name: string;

  @IsString()
  previous_landlord_phone: string;

  @IsString()
  reason_for_leaving: string;

  @IsNumber()
  previous_rent_amount: number;
}

class ReferenceDto {
  @IsString()
  name: string;

  @IsString()
  relationship: string;

  @IsString()
  phone: string;
}

class DocumentDto {
  @IsString()
  type: string;

  @IsString()
  url: string;

  @IsString()
  name: string;
}

export class CreateApplicationDto {
  @IsNumber()
  property_id: number;

  @IsObject()
  @ValidateNested()
  @Type(() => PersonalDataDto)
  personal_data: PersonalDataDto;

  @IsObject()
  @ValidateNested()
  @Type(() => EmploymentDataDto)
  employment_data: EmploymentDataDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RentalHistoryDto)
  rental_history: RentalHistoryDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReferenceDto)
  references: ReferenceDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DocumentDto)
  documents?: DocumentDto[];

  @IsOptional()
  @IsString()
  additional_notes?: string;
}
