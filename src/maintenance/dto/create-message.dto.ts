import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ description: 'Contenido del mensaje' })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Enviar también al residente (solo admin)',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  send_to_resident?: boolean;

  @ApiPropertyOptional({ description: 'Archivos adjuntos', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(3, { message: 'Máximo 3 archivos permitidos' })
  @IsOptional()
  files?: string[];
}
