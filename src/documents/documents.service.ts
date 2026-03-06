import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { OcrService } from './ocr.service';

interface DatosDocumento {
  numero_cedula?: string;
  fecha_nacimiento?: string;
  primer_nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  [key: string]: any;
}

export interface ValidationResult {
  valid: boolean;
  matches: { [key: string]: boolean };
  warnings: string[];
  errors: string[];
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  
  // Validación de contenido mínimo
  private readonly MIN_TEXT_LENGTH = 50; // Mínimo 50 caracteres de texto extraído
  private readonly MIN_DOCUMENT_CONFIDENCE = 3; // Mínimo 3 campos detectados

  constructor(private readonly ocrService: OcrService) {}

  /**
   * Valida si el OCR extrajo suficiente contenido para ser un documento válido
   */
  private validateDocumentContent(extractedData: any, extractedText: string): { valid: boolean; error?: string } {
    // 1. Validar que hay texto suficiente
    if (!extractedText || extractedText.trim().length < this.MIN_TEXT_LENGTH) {
      return {
        valid: false,
        error: `Imagen sin contenido suficiente. Se detectaron menos de ${this.MIN_TEXT_LENGTH} caracteres. Verifica que sea una foto clara del documento.`
      };
    }

    // 2. Validar que detectó campos clave del documento
    const detectedFields = Object.keys(extractedData || {}).filter(
      key => extractedData[key] && String(extractedData[key]).trim() !== ''
    );

    if (detectedFields.length < this.MIN_DOCUMENT_CONFIDENCE) {
      return {
        valid: false,
        error: `Documento no válido. Solo se detectaron ${detectedFields.length} campos. Asegúrate que el documento sea legible y esté completamente visible.`
      };
    }

    // 3. Validar presencia de campos clave según tipo
    const hasId = extractedData?.numero_cedula || extractedData?.numero_documento;
    const hasName = extractedData?.primer_nombre || extractedData?.nombre;
    const hasDate = extractedData?.fecha_nacimiento || extractedData?.fecha;

    if (!hasId && !hasName) {
      return {
        valid: false,
        error: `Documento no identificable. No se pudo extraer información personal. Verifica que sea un documento válido.`
      };
    }

    return { valid: true };
  }

  async processDocument(files: Express.Multer.File[], id: string, type: string = 'general') {
    const uploadDir = path.join(process.cwd(), 'public/documentos_clientes', id);
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const savedPaths: string[] = [];
    let combinedData = {};
    const validationErrors: string[] = [];

    for (const file of files) {
      const fileName = `${Date.now()}_${file.originalname}`;
      const filePath = path.join(uploadDir, fileName);
      
      fs.writeFileSync(filePath, file.buffer);
      savedPaths.push(`documentos_clientes/${id}/${fileName}`);

      // Perform OCR
      try {
        this.logger.debug(`Procesando: ${file.originalname}`);
        const text = await this.ocrService.extractText(file.buffer);
        this.logger.debug(`Texto extraído: ${text.length} caracteres`);
        
        const extracted = this.ocrService.parseDocument(text, type);
        
        // VALIDAR CONTENIDO DEL DOCUMENTO
        const contentValidation = this.validateDocumentContent(extracted, text);
        if (!contentValidation.valid) {
          this.logger.warn(`Validación fallida para ${file.originalname}: ${contentValidation.error}`);
          validationErrors.push(`${file.originalname}: ${contentValidation.error}`);
          continue; // Saltar este archivo
        }
        
        this.logger.debug(`Documento válido: ${file.originalname}`);
        
        // Merge extracted data
        combinedData = { ...combinedData, ...extracted };
      } catch (error) {
        this.logger.error(`Error processing file ${file.originalname}: ${error.message}`);
        validationErrors.push(`${file.originalname}: Error en OCR - ${error.message}`);
      }
    }

    // Si hay errores de validación y no hay datos válidos, lanzar excepción
    if (validationErrors.length > 0 && Object.keys(combinedData).length === 0) {
      throw new BadRequestException({
        message: 'No se pudieron procesar los documentos. Verifica que sean fotos claras y válidas.',
        errors: validationErrors,
        hint: 'Asegúrate que: 1) La imagen sea clara y nítida, 2) Todo el documento sea visible, 3) El documento no sea una copia fotográfica'
      });
    }

    return {
      message: `Archivo(s) procesado(s) con éxito (${savedPaths.length} imagen(s))`,
      paths: savedPaths,
      datos_combinados: type === 'cedula_identidad' ? combinedData : (Object.keys(combinedData).length > 0 ? combinedData : null),
      ...(validationErrors.length > 0 && { warnings: validationErrors })
    };
  }

  async validateCedulaBothSides(datosFrente: any, datosReverso: any): Promise<ValidationResult> {
    this.logger.debug('Iniciando validación cruzada de FRENTE y REVERSO...');

    const validation: ValidationResult = {
      valid: true,
      matches: {},
      warnings: [],
      errors: [],
    };

    // Helper para extraer solo números (ej: "1234567 LP" -> "1234567")
    const getNumbers = (val: any) => {
      if (!val) return '';
      const str = String(val);
      const match = str.match(/\d+/);
      return match ? match[0] : '';
    };

    // Helper para normalizar nombres (eliminar acentos)
    const normalizeName = (str: any) => {
      if (!str) return '';
      return String(str)
        .toUpperCase()
        .trim()
        .replace(/[ÁÀÄÂ]/g, 'A')
        .replace(/[ÉÈËÊ]/g, 'E')
        .replace(/[ÍÌÏÎ]/g, 'I')
        .replace(/[ÓÒÖÔ]/g, 'O')
        .replace(/[ÚÙÜÛ]/g, 'U')
        .trim();
    };

    // Helper para detectar si es cédula antigua (con IDBOL/MRZ) o nueva (BIO)
    const detectCedulaFormat = (datos: any, textoCompleto?: string) => {
      // Cédula nueva (BIO): tiene campo N° con 7 dígitos
      // Cédula vieja: tiene IDBOL en MRZ con 7-9 dígitos
      const ci = String(datos?.numero_cedula || '');
      
      // Si el CI está muy largo (IDBOL suele ser más largo), probablemente sea antigua
      if (ci.length > 8) return 'antigua';
      
      // Si tiene exactamente 7 dígitos y viene de N°, es nueva
      if (ci.length === 7) return 'nueva';
      
      // Default: asumir nueva si no se puede determinar
      return 'nueva';
    };

    // Soporte para múltiples nombres de campo (numero_cedula o numero_documento)
    const ciFrente = getNumbers(datosFrente?.numero_cedula || datosFrente?.numero_documento);
    const ciReverso = getNumbers(datosReverso?.numero_cedula || datosReverso?.numero_documento);
    
    const formatoFrente = detectCedulaFormat(datosFrente);
    const formatoReverso = detectCedulaFormat(datosReverso);
    const sonFormatosDiferentes = formatoFrente !== formatoReverso;

    // Normalizar datos personales
    const nombreFrente = normalizeName(datosFrente?.primer_nombre);
    const nombreReverso = normalizeName(datosReverso?.primer_nombre);
    const apellidoFrente = normalizeName(datosFrente?.apellido_paterno);
    const apellidoReverso = normalizeName(datosReverso?.apellido_paterno);
    
    // Extraer SOLO el primer nombre si hay múltiples (ej: "MARIA RENEE" -> "MARIA")
    const primerNombreFrente = nombreFrente.split(/\s+/)[0];
    const primerNombreReverso = nombreReverso.split(/\s+/)[0];

    // VALIDACIÓN CRÍTICA: Ambos lados DEBEN tener nombre y apellido extraídos
    const datosInsuficientesFrente = !primerNombreFrente || !apellidoFrente;
    const datosInsuficientesReverso = !primerNombreReverso || !apellidoReverso;

    if (datosInsuficientesFrente || datosInsuficientesReverso) {
      this.logger.error(`Datos insuficientes: Frente nombre='${primerNombreFrente}' apellido='${apellidoFrente}' | Reverso nombre='${primerNombreReverso}' apellido='${apellidoReverso}'`);
      validation.errors.push(`No se pudieron extraer nombre/apellido de ambos lados del documento. Revisa la calidad de las imágenes.`);
      validation.valid = false;
      return validation;
    }

    // 1. Validar número de cédula
    if (!ciFrente || !ciReverso) {
      this.logger.error(`Cedula incompleta: Frente (${ciFrente || 'NO DETECTADO'}) vs Reverso (${ciReverso || 'NO DETECTADO'})`);
      validation.errors.push(`No se detectó número de cédula en ambos lados del documento.`);
      validation.valid = false;
      return validation;
    }

    validation.matches.numero_cedula = ciFrente === ciReverso;
    
    // Si NOMBRES y APELLIDOS coinciden, es la misma persona - no rechaza por CI diferente
    if (!validation.matches.numero_cedula) {
      this.logger.debug(`CI diferentes: Frente (${ciFrente}) vs Reverso (${ciReverso})`);
    }

    // 2. Validar fecha de nacimiento
    const fechaFrente = datosFrente?.fecha_nacimiento;
    const fechaReverso = datosReverso?.fecha_nacimiento;

    if (!fechaFrente || !fechaReverso) {
      this.logger.warn(`Fecha ausente: Frente (${fechaFrente || 'NO DETECTADA'}) vs Reverso (${fechaReverso || 'NO DETECTADA'})`);
      
      if (!sonFormatosDiferentes) {
        validation.warnings.push(`No se detectó la fecha de nacimiento en uno o ambos lados`);
      }
    } else {
      validation.matches.fecha_nacimiento = fechaFrente === fechaReverso;
      
      if (!validation.matches.fecha_nacimiento) {
        this.logger.error(`Fechas no coinciden: Frente (${fechaFrente}) vs Reverso (${fechaReverso})`);
        
        if (sonFormatosDiferentes) {
          this.logger.debug(`Formatos diferentes: permitiendo discrepancia en fecha`);
          validation.warnings.push(`Fechas no coinciden pero son formatos diferentes - validando identidad`);
        } else {
          validation.errors.push(`La fecha de nacimiento no coincide entre ambos lados.`);
          validation.valid = false;
          return validation;
        }
      } else {
        this.logger.debug(`Fecha de nacimiento coincide: ${fechaFrente}`);
      }
    }

    // VALIDACIÓN FINAL: Por identidad personal (NOMBRES + APELLIDOS)
    const apellidoMatch = apellidoFrente && apellidoReverso && apellidoFrente === apellidoReverso;
    const primerNombreMatch = primerNombreFrente && primerNombreReverso && primerNombreFrente === primerNombreReverso;
    const fechaMatch = validation.matches.fecha_nacimiento;

    // CRITERIO DECISIVO: Si NOMBRES + APELLIDOS + FECHA coinciden → ES LA MISMA PERSONA → ACEPTAR
    if (primerNombreMatch && apellidoMatch && fechaMatch) {
      this.logger.debug(`Documento valido: ${primerNombreFrente} ${apellidoFrente}`);
      validation.valid = true;
      return validation;
    }

    // Si NO coinciden nombres → No es la misma persona → RECHAZAR
    if (!primerNombreMatch) {
      this.logger.error(`Nombre diferente: ${primerNombreFrente} vs ${primerNombreReverso}`);
      validation.errors.push(`Los nombres no coinciden. Documentos de personas diferentes.`);
      validation.valid = false;
      return validation;
    }

    if (!apellidoMatch) {
      this.logger.error(`Apellido diferente: ${apellidoFrente} vs ${apellidoReverso}`);
      validation.errors.push(`Los apellidos no coinciden. Documentos de personas diferentes.`);
      validation.valid = false;
      return validation;
    }

    if (!fechaMatch) {
      this.logger.error(`Fecha diferente: ${fechaFrente} vs ${fechaReverso}`);
      validation.errors.push(`Las fechas no coinciden.`);
      validation.valid = false;
      return validation;
    }

    this.logger.debug(`Validación completada: Valid=${validation.valid}`);
    this.logger.debug(`Errores: ${validation.errors.length}, Advertencias: ${validation.warnings.length}`);

    return validation;
  }
}
