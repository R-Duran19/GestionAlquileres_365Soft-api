import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import * as path from 'path';
import * as fs from 'fs';

@ApiTags('Static Files')
@Controller('storage')
export class StaticFilesController {
  /**
   * Servir imágenes de propiedades
   * Ruta: /storage/properties/:tenant/:propertyId/:filename
   */
  @Get('properties/:tenant/:propertyId/:filename')
  @ApiOperation({ summary: 'Obtener imagen de propiedad' })
  @ApiParam({ name: 'tenant', description: 'Slug del tenant' })
  @ApiParam({ name: 'propertyId', description: 'ID de la propiedad' })
  @ApiParam({ name: 'filename', description: 'Nombre del archivo' })
  async getPropertyImage(
    @Param('tenant') tenant: string,
    @Param('propertyId') propertyId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = path.join(
      process.cwd(),
      'storage',
      'properties',
      tenant,
      propertyId,
      filename,
    );

    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    // Enviar el archivo
    return res.sendFile(filePath);
  }
}
