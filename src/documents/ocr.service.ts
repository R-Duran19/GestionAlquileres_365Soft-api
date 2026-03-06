import { Injectable, Logger } from '@nestjs/common';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private client: ImageAnnotatorClient;

  constructor() {
    const keyPath = path.join(process.cwd(), 'storage/credentials/documentos-475421-6eda096856ed.json');
    
    if (fs.existsSync(keyPath)) {
      this.client = new ImageAnnotatorClient({
        keyFilename: keyPath,
      });
      this.logger.log('Google Cloud Vision client initialized');
    } else {
      this.logger.error(`Google Cloud credentials not found at ${keyPath}. OCR will not work.`);
    }
  }

  async extractText(imageBuffer: Buffer): Promise<string> {
    if (!this.client) {
      this.logger.error('Error: Cliente OCR no inicializado (faltan credenciales)');
      throw new Error('OCR client not initialized due to missing credentials');
    }

    try {
      this.logger.debug('Iniciando lectura de archivo...');
      this.logger.debug('Enviando a Google Cloud Vision API...');
      
      const [result] = await this.client.textDetection(imageBuffer);
      
      this.logger.debug('Respuesta recibida de Google Vision');
      
      const fullTextAnnotation = result.fullTextAnnotation;
      return (fullTextAnnotation && fullTextAnnotation.text) ? fullTextAnnotation.text : '';
    } catch (error) {
      this.logger.error('Error en Google Vision:', error);
      throw error;
    }
  }

  parseDocument(text: string, type: string = 'general') {
    const datos: any = {};
    const cleanLines = text.split('\n').map(line => line.trim().toUpperCase());
    const fullText = cleanLines.join(' ');

    this.logger.debug(`Procesando documento tipo: ${type}`);

    // Si es cédula, intentar detectar si es frente o reverso por contenido
    if (type === 'cedula_identidad') {
      const isReverso = /DOMICILIO|PROFESIÓN|ESTADO CIVIL|LUGAR DE NACIMIENTO|IDBOL/i.test(fullText);
      if (isReverso) {
        return this.extractCedulaReverso(text, cleanLines);
      } else {
        return this.extractCedulaData(text, cleanLines);
      }
    }

    if (type === 'cedula_frente') {
      return this.extractCedulaData(text, cleanLines);
    } else if (type === 'cedula_reverso') {
      return this.extractCedulaReverso(text, cleanLines);
    } else if (type === 'folio_real') {
      return this.extractFolioRealData(fullText);
    } else if (type === 'testimonio') {
      return this.extractTestimonioData(fullText);
    }

    // Default analysis
    const matriculaMatch = fullText.match(/MATR[IÍ]CULA:?\s*([\d\.\-]+)/i);
    if (matriculaMatch) datos.matricula = matriculaMatch[1];
    
    const dateMatch = fullText.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dateMatch) datos.fecha = dateMatch[0];

    return datos;
  }

  private extractCedulaData(text: string, cleanLines: string[]) {
    const datos: any = {};
    const fullText = cleanLines.join(' ');

    this.logger.debug('Procesando FRENTE de cédula...');

    // ===== ESTRATEGIA 1: Extraer del MRZ (Cédulas nuevas) =====
    // MRZ Formato: 
    // Línea 1: I<BOL + número CI
    // Línea 3: APELLIDO<NOMBRE<...
    
    const mrzLine1 = /(?:I<BOL|IDBOL)(\d{7,10})/i;
    const mrzLine3 = /([A-Z<]+)<([A-Z<]+)</;
    
    let ciFromMRZ = '';
    let nombresFromMRZ: any = {};
    
    for (const line of cleanLines) {
      const trimmed = line.trim().replace(/\s+/g, '');
      
      // Buscar primer línea MRZ (Nuevo: Soporta IDBOL o I<BOL)
      const match1 = trimmed.match(mrzLine1);
      if (match1) {
        ciFromMRZ = match1[1];
        this.logger.debug(`MRZ Frente - CI extraído: ${ciFromMRZ}`);
      }
      
      // Buscar línea MRZ con nombres (tiene < como separador)
      if (/</.test(trimmed) && /[A-Z]/.test(trimmed) && trimmed.length > 20) {
        const match3 = trimmed.match(mrzLine3);
        if (match3) {
          const apellidos = match3[1].replace(/</g, '').trim();
          const nombres = match3[2].replace(/</g, '').trim();
          
          if (apellidos.length > 2 && !apellidos.includes('BOL')) {
            const partes = apellidos.split(/\s+/);
            if (partes.length >= 1) {
              nombresFromMRZ.apellido_paterno = partes[0];
            }
            if (partes.length >= 2) {
              nombresFromMRZ.apellido_materno = partes.slice(1).join(' ');
            }
          }
          
          if (nombres.length > 2) {
            const nombrePartes = nombres.split(/\s+/);
            nombresFromMRZ.primer_nombre = nombrePartes[0];
            if (nombrePartes.length > 1) {
              nombresFromMRZ.otros_nombres = nombrePartes.slice(1).join(' ');
            }
          }
          
          if (Object.keys(nombresFromMRZ).length > 0) {
            this.logger.debug(`MRZ - Nombres extraídos: ${JSON.stringify(nombresFromMRZ)}`);
          }
        }
      }
    }

    // Si encontramos MRZ, usar esos datos
    if (ciFromMRZ) {
      datos.numero_cedula = ciFromMRZ;
      Object.assign(datos, nombresFromMRZ);
    }

    // ===== ESTRATEGIA 2: Extraer de etiquetas de texto (Fallback o Formato nuevo sin MRZ visible) =====
    
    if (!datos.numero_cedula) {
      // 1. CI Number - Look for the red "N°" label (Common in new IDs)
      const ciLabelRegex = /N[°º]\s*(\d{7,10})/i;
      const ciLabelMatch = text.match(ciLabelRegex);
      if (ciLabelMatch) {
        datos.numero_cedula = ciLabelMatch[1];
        this.logger.debug(`CI extraído (N°): ${datos.numero_cedula}`);
      }
    }

    // 2. Names and Surnames - Multi-pattern support
    if (!datos.primer_nombre) {
      for (let i = 0; i < cleanLines.length; i++) {
        const line = cleanLines[i].trim();
        
        // Pattern: NOMBRES: [VALUE]
        if (/NOMBRES/i.test(line)) {
          const match = line.match(/NOMBRES:?\s*(.+)/i);
          if (match && match[1].length > 2) {
            datos.primer_nombre = match[1].trim();
            this.logger.debug(`Nombre extraído (NOMBRES): ${datos.primer_nombre}`);
          } else if (cleanLines[i+1]) {
            datos.primer_nombre = cleanLines[i+1].trim();
            this.logger.debug(`Nombre extraído (Línea siguiente NOMBRES): ${datos.primer_nombre}`);
          }
        }
        
        // Pattern: APELLIDOS: [VALUE]
        if (/APELLIDOS/i.test(line)) {
          const match = line.match(/APELLIDOS:?\s*(.+)/i);
          if (match && match[1].length > 2) {
            const apellidos = match[1].trim().split(/\s+/);
            datos.apellido_paterno = apellidos[0];
            if (apellidos.length > 1) datos.apellido_materno = apellidos.slice(1).join(' ');
            this.logger.debug(`Apellidos extraídos: ${datos.apellido_paterno}`);
          } else if (cleanLines[i+1]) {
            const apellidos = cleanLines[i+1].trim().split(/\s+/);
            datos.apellido_paterno = apellidos[0];
            if (apellidos.length > 1) datos.apellido_materno = apellidos.slice(1).join(' ');
            this.logger.debug(`Apellidos extraídos (Línea siguiente): ${datos.apellido_paterno}`);
          }
        }
      }
    }

    // 3. Birth Date - Search for label "FECHA DE NACIMIENTO"
    if (!datos.fecha_nacimiento) {
      for (let i = 0; i < cleanLines.length; i++) {
        if (/FECHA DE NACIMIENTO/i.test(cleanLines[i])) {
          // Buscar en la misma línea primero
          const sameLineMatch = cleanLines[i].match(/(\d{2})[/-](\d{2})[/-](\d{4})/);
          if (sameLineMatch) {
            datos.fecha_nacimiento = `${sameLineMatch[1]}/${sameLineMatch[2]}/${sameLineMatch[3]}`;
            this.logger.debug(`Fecha Nacimiento extraída (Misma línea): ${datos.fecha_nacimiento}`);
            break;
          }
          // Si no, buscar en la línea siguiente
          const nextLine = cleanLines[i+1];
          const dateMatch = nextLine ? nextLine.match(/(\d{2})[/-](\d{2})[/-](\d{4})/) : null;
          if (dateMatch) {
            datos.fecha_nacimiento = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
            this.logger.debug(`Fecha Nacimiento extraída (Línea siguiente): ${datos.fecha_nacimiento}`);
            break;
          }
        }
      }
    }

    // 4. Fallback for Birth Date (Born on... or generic)
    if (!datos.fecha_nacimiento) {
      for (const line of cleanLines) {
        const nacidoMatch = line.match(/Nacido\s+el\s+(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
        if (nacidoMatch) {
          const day = nacidoMatch[1].padStart(2, '0');
          const monthText = nacidoMatch[2].toUpperCase();
          const year = nacidoMatch[3];
          const monthMap: { [key: string]: string } = {
            'ENERO': '01', 'FEBRERO': '02', 'MARZO': '03', 'ABRIL': '04',
            'MAYO': '05', 'JUNIO': '06', 'JULIO': '07', 'AGOSTO': '08',
            'SEPTIEMBRE': '09', 'OCTUBRE': '10', 'NOVIEMBRE': '11', 'DICIEMBRE': '12'
          };
          const month = monthMap[monthText] || monthText;
          datos.fecha_nacimiento = `${day}/${month}/${year}`;
          break;
        }
      }
    }

    // 4. Extract from MRZ date if still not found
    if (!datos.fecha_nacimiento) {
      const mrzDatePattern = /([0-9]{2})([0-9]{2})([0-9]{2})[MF]/;
      const mrzDateMatch = fullText.match(mrzDatePattern);
      if (mrzDateMatch) {
        const yy = mrzDateMatch[1];
        const mm = mrzDateMatch[2];
        const dd = mrzDateMatch[3];
        // En el MRZ, el formato suele ser YYMMDD. 
        // Si el año es > 40, asumimos 19xx, si es <= 40 asumimos 20xx
        const year = parseInt(yy) > 40 ? `19${yy}` : `20${yy}`;
        datos.fecha_nacimiento = `${dd}/${mm}/${year}`;
        this.logger.debug(`Fecha extraída del MRZ: ${datos.fecha_nacimiento}`);
      }
    }

    // Cleanup
    if (datos.primer_nombre === 'CÉDULA DE' || datos.primer_nombre === 'IDENTIDAD') {
      datos.primer_nombre = '';
    }

    // Fallback for CI if not found
    if (!datos.numero_cedula) {
      const ciRegex = /\b(\d{7,8})\b/g;
      const matches = fullText.match(ciRegex);
      if (matches) {
        datos.numero_cedula = matches[matches.length - 1];
        this.logger.debug(`CI extraído (fallback): ${matches[matches.length - 1]}`);
      }
    }

    if (Object.keys(datos).length === 0) {
      this.logger.error('No se pudo extraer información del frente');
      return null;
    }

    this.logger.debug(`Frente procesado: ${JSON.stringify(datos)}`);
    return datos;
  }

  private extractFolioRealData(text: string) {
    const datos: any = {};
    // Patrón X.XX.X.XX.XXXXXX
    const matriculaMatch = text.match(/MATR[IÍ]CULA\s*N[°º]?\s*[:\s]*(\d{1,2}\.\d{2}\.\d{1,2}\.\d{2}\.\d{4,8})/i) 
                        || text.match(/\b(\d{1,2}\.\d{2}\.\d{1,2}\.\d{2}\.\d{4,8})\b/);
    
    if (matriculaMatch) {
      datos.matricula = matriculaMatch[1].replace(/[\s\-]+/g, '');
    }
    return datos;
  }

  private extractTestimonioData(text: string) {
    const datos: any = {};
    const testimonioMatch = text.match(/TESTIMONIO\s*N[°º]?\s*[:\s]*(\d+\/\d{4})/i)
                         || text.match(/\b(\d{3,5}\/\d{4})\b/);
    
    if (testimonioMatch) {
      datos.numero_testimonio = testimonioMatch[1];
    }
    return datos;
  }

  private capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  private extractCedulaReverso(text: string, cleanLines: string[]) {
    const datos: any = {};
    const fullText = cleanLines.join(' ');

    this.logger.debug('Procesando REVERSO de la cédula (Soporte Dual: Antigua + Nueva)...');
    // LOG - solo líneas significativas (sin spam de líneas vacías)
    this.logger.debug(`Procesando ${cleanLines.length} lineas del reverso`);

    // 1. EXTRAER NÚMERO DE CÉDULA
    const mrzPattern = /IDBOL([0-9A-Z]+)/i;
    const mrzMatch = fullText.replaceAll(' ', '').match(mrzPattern);

    if (mrzMatch) {
      // Extraer solo la parte numérica inicial del MRZ (ej: IDBOL8942507 -> 8942507)
      const ciPart = mrzMatch[1].match(/^(\d+)/); 
      if (ciPart) {
        datos.numero_cedula = ciPart[1];
        this.logger.debug(`CI extraído del MRZ (IDBOL): ${datos.numero_cedula}`);
      }
    }

    if (!datos.numero_cedula) {
      // Intenta formatos tradicionales o el N° rojo
      const ciRegex = /N[°º]\s*(\d{7,10})/i;
      const ciMatch = fullText.match(ciRegex);
      if (ciMatch) {
        datos.numero_cedula = ciMatch[1];
        this.logger.debug(`CI extraído con etiqueta N°: ${ciMatch[1]}`);
      } else {
        const genericCI = fullText.match(/\b(\d{7})\b/);
        if (genericCI) {
          datos.numero_cedula = genericCI[1];
          this.logger.debug(`CI extraído genéricamente (7 dígitos): ${genericCI[1]}`);
        } else {
          const fallbackCI = fullText.match(/\b(\d{7,8})\b/);
          if (fallbackCI) {
            datos.numero_cedula = fallbackCI[1];
            this.logger.debug(`CI extraído fallback (7-8 dígitos): ${fallbackCI[1]}`);
          }
        }
      }
    }

    // 2. EXTRAER FECHA DE NACIMIENTO
    let fechaEncontrada = false;
    
    // Estrategia 1: Formato "Nacido el..." (Cédulas antiguas/tradicionales)
    for (const line of cleanLines) {
      if (/Nacido/i.test(line)) {
        const nacidoPattern = /Nacido\s+(?:el\s+)?(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i;
        const match = line.match(nacidoPattern);
        
        if (match) {
          const day = match[1].padStart(2, '0');
          const monthText = match[2].toUpperCase();
          const year = match[3];
          
          const monthMap: { [key: string]: string } = {
            'ENERO': '01', 'FEBRERO': '02', 'MARZO': '03', 'ABRIL': '04',
            'MAYO': '05', 'JUNIO': '06', 'JULIO': '07', 'AGOSTO': '08',
            'SEPTIEMBRE': '09', 'OCTUBRE': '10', 'NOVIEMBRE': '11', 'DICIEMBRE': '12'
          };
          
          const month = monthMap[monthText] || monthText;
          datos.fecha_nacimiento = `${day}/${month}/${year}`;
          this.logger.debug(`Fecha extraída (Nacido el): ${datos.fecha_nacimiento}`);
          fechaEncontrada = true;
          break;
        }
      }
    }
    
    // Estrategia 2: Formato MRZ (Cédulas modernas)
    if (!fechaEncontrada) {
      // El formato MRZ de carnet es: IDBOL[NRO]<<[DIGITO_VERIF]<<<<<<
      // Segunda línea: [YYMMDD][DIGITO][SEXO][EXPIRACION][NACIONALIDAD]<<
      const mrzSecondLinePattern = /\b(\d{6})\d[MF]\d{6}/;
      const mrzMatch = fullText.match(mrzSecondLinePattern);
      
      if (mrzMatch) {
        const dateStr = mrzMatch[1];
        const yy = dateStr.substring(0, 2);
        const mm = dateStr.substring(2, 4);
        const dd = dateStr.substring(4, 6);
        const year = parseInt(yy) > 40 ? `19${yy}` : `20${yy}`;
        datos.fecha_nacimiento = `${dd}/${mm}/${year}`;
        this.logger.debug(`Fecha extraída del MRZ (MÉTODO SEGURO): ${datos.fecha_nacimiento}`);
        fechaEncontrada = true;
      }
    }

    // Estrategia 3: Cualquier fecha DD/MM/YYYY
    if (!fechaEncontrada) {
      const dateRegex = /(\d{2})\/(\d{2})\/(\d{4})/;
      const simpleDateMatch = fullText.match(dateRegex);
      if (simpleDateMatch) {
        datos.fecha_nacimiento = simpleDateMatch[0];
        this.logger.debug(`Fecha extraída (DD/MM/YYYY): ${datos.fecha_nacimiento}`);
        fechaEncontrada = true;
      }
    }

    // BANDERA: tracking de si los nombres vinieron del MRZ (tienen prioridad absoluta)
    let nombreDelMRZ = false;
    let apellidoDelMRZ = false;

    // DEBUG: Mostrar TODAS las líneas para entender la estructura
    this.logger.debug(`LÍNEAS DEL REVERSO A PROCESAR (${cleanLines.length}):`);
    cleanLines.forEach((line, idx) => {
      this.logger.debug(`  L${idx}: "${line}"`);
    });

    // ============================================
    // PASADA 1: BUSCAR NOMBRES SOLO EN EL MRZ
    // ============================================
    // El MRZ tiene PRIORIDAD ABSOLUTA
    this.logger.debug(`----> PASADA 1: Buscando MRZ...`);
    
    for (let i = 0; i < cleanLines.length; i++) {
      const line = cleanLines[i];
      
      // Buscar línea con << (patrón MRZ explícito)
      if (line.includes('<<')) {
        this.logger.debug(`ENCONTRADO PATRÓN MRZ EN LÍNEA ${i}: "${line}"`);
        
        const parts = line.split('<<');
        if (parts.length >= 2) {
          // part[0] = APELLIDOS
          // part[1+] = NOMBRES
          
          const apellidosPart = parts[0].replace(/</g, ' ').trim();
          const apellidosWords = apellidosPart.split(/\s+/).filter(w => /^[A-Z]{2,}$/.test(w));
          
          if (apellidosWords.length > 0 && !datos.apellido_paterno) {
            datos.apellido_paterno = apellidosWords[0];
            apellidoDelMRZ = true;
            this.logger.debug(`APELLIDO DEL MRZ: ${datos.apellido_paterno}`);
          }
          
          const nombresPart = parts.slice(1).join('<<').replace(/</g, ' ').replace(/R$/i, '').trim();
          const nombresWords = nombresPart.split(/\s+/).filter(w => /^[A-Z]{2,}$/.test(w));
          
          if (nombresWords.length > 0 && !datos.primer_nombre) {
            datos.primer_nombre = nombresWords[0];
            nombreDelMRZ = true;
            this.logger.debug(`NOMBRE DEL MRZ: ${datos.primer_nombre}`);
          }
          
          if (nombreDelMRZ && apellidoDelMRZ) {
            this.logger.debug(`NOMBRES COMPLETOS DEL MRZ: ${datos.apellido_paterno}, ${datos.primer_nombre}`);
            break; // Salir de la búsqueda de MRZ
          }
        }
      }
    }

    // ============================================
    // PASADA 2: BUSCAR SOLO DATOS FALTANTES EN TEXTO PLANO
    // ============================================
    // SOLO si no encontramos nombres en el MRZ
    this.logger.debug(`----> PASADA 2: Buscando en texto plano...`);
    
    if (!nombreDelMRZ || !apellidoDelMRZ) {
      const commonFirstNames = ['CLAUDIO', 'MARIA', 'JUAN', 'JOSE', 'CARLOS', 'LUIS', 'MIGUEL', 'JORGE', 'MANUEL', 'FRANCISCO',
                                'PABLO', 'FERNANDO', 'RICARDO', 'FELIPE', 'DAVID', 'SERGIO', 'RAUL', 'ENRIQUE', 'RAMON',
                                'ANA', 'ROSA', 'TERESA', 'CARMEN', 'GLORIA', 'MARINA', 'PATRICIA', 'SANDRA', 'BARBARA', 'ANGELA',
                                'ELENA', 'CAROLINA', 'ELIZABETH', 'CATHERINE', 'MARCELA', 'EDITH', 'MONICA', 'SYLVIA', 'SILVIA',
                                'ANNE', 'RENE', 'RENEE', 'SANTIAGO', 'DIEGO', 'VICTOR', 'HECTOR', 'WALTER', 'ORLANDO', 'ANIBAL'];
      
      const commonLastNames = ['ZENTENO', 'RODRIGUEZ', 'GONZALEZ', 'QUITO', 'SANCHEZ', 'LOPEZ', 'GARCIA', 'MARTINEZ', 
                               'HERNANDEZ', 'MORALES', 'TORRES', 'FLORES', 'RIVERA', 'ROJAS', 'VARGAS', 'CASTILLO', 
                               'REYES', 'SILVA', 'CRUZ', 'MEDINA', 'FUENTES', 'SOTO', 'PENA', 'CAMPOS', 'ROMERO'];
      
      for (let i = 0; i < cleanLines.length; i++) {
        const line = cleanLines[i];
        const lineUpperCase = line.toUpperCase();
        
        // SOLO buscar si aún no tenemos el nombre
        if (!nombreDelMRZ) {
          for (const fname of commonFirstNames) {
            if (lineUpperCase.includes(fname) && !datos.primer_nombre) {
              datos.primer_nombre = fname;
              this.logger.debug(`Nombre (texto): ${fname} [línea ${i}]`);
              break;
            }
          }
        }
        
        // SOLO buscar si aún no tenemos el apellido
        if (!apellidoDelMRZ) {
          for (const lname of commonLastNames) {
            if (lineUpperCase.includes(lname) && !datos.apellido_paterno) {
              datos.apellido_paterno = lname;
              this.logger.debug(`Apellido (texto): ${lname} [línea ${i}]`);
              break;
            }
          }
        }
        
        // Estrategia B: formato "A: NOMBRE APELLIDO"
        const aFmtMatch = line.match(/^A:\s+([A-Z\s]+)$/i);
        if (aFmtMatch && (!nombreDelMRZ || !apellidoDelMRZ)) {
          const nameStr = aFmtMatch[1].trim();
          const words = nameStr.split(/\s+/).filter(w => w.length > 1);
          
          if (words.length >= 1 && !datos.primer_nombre && !nombreDelMRZ) {
            datos.primer_nombre = words[0];
            this.logger.debug(`Nombre desde 'A:': ${datos.primer_nombre}`);
          }
          
          if (words.length >= 2 && !datos.apellido_paterno && !apellidoDelMRZ) {
            datos.apellido_paterno = words[1];
            this.logger.debug(`Apellido desde 'A:': ${datos.apellido_paterno}`);
          }
        }
      }
    }

    // ============================================
    // PASADA 3: PROCESAR DATOS FIJOS (Domicilio, Estado Civil, etc)
    // ============================================
    for (let i = 0; i < cleanLines.length; i++) {
      const line = cleanLines[i];

      // Estado Civil
      if (/Estado\s+Civil/i.test(line)) {
        const match = line.match(/Estado\s+Civil\s+(.+)/i);
        datos.estado_civil = match ? match[1].trim() : (cleanLines[i+1] || '').trim();
      }

      // Profesión / Ocupación
      if (/Profe/i.test(line) || /Ocupaci/i.test(line)) {
        const match = line.match(/(?:Profesi[oó]n|Ocupaci[oó]n)\b\s*[\/\-]*\s*(.+)/i);
        datos.profesion = match ? match[1].trim() : (cleanLines[i+1] || '').trim();
      }

      // Domicilio - Búsqueda en línea actual o siguiente
      if (/Domicilio/i.test(line)) {
        const match = line.match(/Domicilio\s*[()]*\s*(.+)/i);
        let dom = match ? match[1].trim() : (cleanLines[i+1] || '').trim();
        
        // --- LIMPIEZA AGRESIVA DE RUIDO ---
        // 1. Eliminar palabras del fondo de seguridad (ADOPLURINACIONAL, BOLIVIA, SERVICIO, etc.)
        dom = dom.replace(/ADOPLURINACIONAL|BOLIVIA|ESTADO|PLURINACIONAL|SERVICIO|GENERAL|IDENTIFICACIÓN/gi, '');
        // 2. Eliminar códigos de serie o números sueltos típicos del pie de página
        dom = dom.replace(/\b\d{6,}\b/g, ''); 
        // 3. Eliminar caracteres especiales de OCR corrido
        dom = dom.replace(/[()[\]{}_|]/g, '');
        
        datos.domicilio = dom.trim().substring(0, 150);
        this.logger.debug(`Domicilio extraído y limpio: ${datos.domicilio}`);
      }

      // Lugar de Trámite - Evitar que capture el MRZ o pie de página
      if (/^En\s+/i.test(line) && line.length > 5 && !datos.lugar_tramite) {
        let lugar = line.replace(/^En\s+/i, '').trim();
        if (!lugar.includes('<')) { // Evitar líneas de MRZ que empiecen con EN (raro pero posible)
           datos.lugar_tramite = lugar.replace(/ADOPLURINACIONAL/gi, '').trim();
        }
      }
    }

    // Limpieza final de ruidos comunes
    if (datos.profesion) datos.profesion = datos.profesion.replace(/[()]/g, '').trim();
    if (datos.estado_civil) datos.estado_civil = datos.estado_civil.replace(/[()]/g, '').trim();

    if (Object.keys(datos).length === 0) {
      this.logger.error('NO SE DETECTÓ INFORMACIÓN EN EL REVERSO');
      return null;
    }

    this.logger.debug(`Reverso procesado: ${JSON.stringify(datos)}`);
    return datos;
  }
}


