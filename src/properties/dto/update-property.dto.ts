import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreatePropertyDto } from './create-property.dto';

export class UpdatePropertyDto extends PartialType(
  OmitType(CreatePropertyDto, [
    'title',
    'property_type_id',
    'property_subtype_id',
    'addresses',
  ] as const),
) {
  // Permite actualizar título y tipos en edición
  title?: string;
  property_type_id?: number;
  property_subtype_id?: number;
  addresses?: CreatePropertyDto['addresses'];

  // Campos de detalles (edición posterior)
  description?: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
  amenities?: string[];
  included_items?: string[];
  security_deposit_amount?: number;
}
