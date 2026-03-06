import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFiles, 
  Body, 
  HttpCode, 
  HttpStatus,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';

@Controller('documentos')
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('store')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('archivos', 10))
  async store(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('id') id: string,
    @Body('terreno_id') terreno_id: string,
    @Body('tipo_documento') tipo_documento: string,
  ) {
    const targetId = id || terreno_id || 'temp';
    
    try {
      const result = await this.documentsService.processDocument(files, targetId, tipo_documento);
      return result;
    } catch (error) {
      this.logger.error('Error procesando documento: ' + error.message);
      throw error;
    }
  }

  @Post('validate')
  async validateCedula(
    @Body('datos_frente') datosFrente: any,
    @Body('datos_reverso') datosReverso: any,
    @Body('frente') bodyFrente: any,
    @Body('reverso') bodyReverso: any,
    @Body('id') id: string,
  ) {
    const finalFrente = datosFrente || bodyFrente || {};
    const finalReverso = datosReverso || bodyReverso || {};

    try {
      const validation = await this.documentsService.validateCedulaBothSides(finalFrente, finalReverso);
      
      if (!validation.valid) {
        const errorMessage = validation.errors[0] || 'Documento inválido';
        throw new BadRequestException({
          message: errorMessage,
          cedula_valida: false,
          validacion: validation,
          errors: validation.errors,
        });
      }
      
      return {
        statusCode: 200,
        message: 'Documento válido',
        cedula_valida: true,
        validacion: validation,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error en validacion: ' + error.message);
      throw new BadRequestException({
        message: error.message || 'Error durante la validación',
        cedula_valida: false,
      });
    }
  }
}
