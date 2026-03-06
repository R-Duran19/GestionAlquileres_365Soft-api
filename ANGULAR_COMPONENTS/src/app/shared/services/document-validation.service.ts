import { Injectable } from '@angular/core';

export interface DocumentValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentValidationService {
  
  // Configuración de validaciones
  private readonly MIN_WIDTH = 640;
  private readonly MIN_HEIGHT = 480;
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

  /**
   * Valida un archivo de documento antes de subirlo
   */
  validateDocumentFile(file: File): DocumentValidationResult {
    // 1. Validar que sea un archivo
    if (!file) {
      return { valid: false, error: 'No se seleccionó archivo' };
    }

    // 2. Validar extensión
    const fileName = file.name.toLowerCase();
    const hasValidExtension = this.ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      return {
        valid: false,
        error: `Formato no permitido. Solo se aceptan: ${this.ALLOWED_EXTENSIONS.join(', ')}`
      };
    }

    // 3. Validar tipo MIME
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de archivo inválido. Se requiere imagen (JPEG, PNG, WebP)`
      };
    }

    // 4. Validar tamaño
    if (file.size > this.MAX_FILE_SIZE) {
      const sizeMB = (this.MAX_FILE_SIZE / 1024 / 1024).toFixed(0);
      return {
        valid: false,
        error: `Archivo muy grande. Máximo ${sizeMB}MB`
      };
    }

    if (file.size < 50 * 1024) { // 50KB mínimo
      return {
        valid: false,
        error: 'Archivo muy pequeño. Mínimo 50KB'
      };
    }

    return { valid: true };
  }

  /**
   * Valida dimensiones de la imagen
   */
  async validateImageDimensions(file: File): Promise<DocumentValidationResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        const img = new Image();
        
        img.onload = () => {
          if (img.width < this.MIN_WIDTH || img.height < this.MIN_HEIGHT) {
            resolve({
              valid: false,
              error: `Resolución muy baja. Mínimo ${this.MIN_WIDTH}x${this.MIN_HEIGHT}px. Detectado: ${img.width}x${img.height}px`
            });
          } else {
            resolve({ valid: true });
          }
        };

        img.onerror = () => {
          resolve({
            valid: false,
            error: 'No se pudo leer la imagen. Verifique que sea un archivo válido'
          });
        };

        img.src = e.target.result;
      };

      reader.onerror = () => {
        resolve({
          valid: false,
          error: 'Error al leer el archivo'
        });
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Valida que la imagen tenga características de documento
   * (contraste, claridad, tamaño adecuado, NO borrosa)
   */
  async analyzeDocumentQuality(file: File): Promise<DocumentValidationResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ valid: true }); // No se puede analizar, pero sigue adelante
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // 1. ANÁLISIS DE CONTRASTE (diferencia entre píxeles claros y oscuros)
          let brightPixels = 0;
          let darkPixels = 0;
          let edgePixelsCount = 0;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r + g + b) / 3;

            if (brightness > 200) brightPixels++;
            else if (brightness < 50) darkPixels++;
          }

          // 2. ANÁLISIS DE BORDES/NITIDEZ (detección de desenfoque)
          // Si hay muchas transiciones de píxeles, la imagen está nítida
          // Si hay pocas transiciones, la imagen está borrosa
          const blurPixels = document.createElement('canvas');
          const blurCtx = blurPixels.getContext('2d');
          if (blurCtx) {
            blurCtx.drawImage(img, 0, 0);
            const blurData = blurCtx.getImageData(0, 0, canvas.width, canvas.height);
            const bd = blurData.data;

            // Detectar variación de píxeles (si no hay variación = imagen borrosa)
            let pixelVariation = 0;
            for (let i = 0; i < bd.length - 4; i += 4) {
              const diff = Math.abs(bd[i] - bd[i + 4]);
              if (diff > 20) pixelVariation++;
            }

            const totalPixels = bd.length / 4;
            const variationRatio = pixelVariation / totalPixels;

            // Si la variación es muy baja, la imagen está borrosa
            if (variationRatio < 0.05) {
              resolve({
                valid: false,
                error: '❌ Imagen borrosa o desenfocada. Toma una foto más clara y nítida del documento'
              });
              return;
            }
          }

          const totalPixels = data.length / 4;
          const contrastRatio = (brightPixels + darkPixels) / totalPixels;

          // 3. VALIDACIÓN DE CONTRASTE (más estricta que antes)
          if (contrastRatio < 0.25) {
            resolve({
              valid: false,
              error: '❌ Imagen muy borrosa o poco clara. Necesitas una foto más nítida del documento.'
            });
            return;
          }

          // 4. ADVERTENCIA si está demasiado clara
          if (contrastRatio > 0.95) {
            resolve({
              valid: true,
              warning: '⚠️ Imagen muy clara. Verifica que sea una foto real del documento (no una fotocopia descolorida)'
            });
            return;
          }

          // ✅ Imagen válida
          resolve({ valid: true });
        };

        img.onerror = () => {
          resolve({ valid: true }); // No se puede analizar, sigue adelante
        };

        img.src = e.target.result;
      };

      reader.onerror = () => {
        resolve({ valid: true });
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Validación completa: archivo + dimensiones + calidad
   */
  async validateCompleteDocument(file: File): Promise<DocumentValidationResult> {
    // 1. Validar archivo básico
    const basicValidation = this.validateDocumentFile(file);
    if (!basicValidation.valid) {
      return basicValidation;
    }

    // 2. Validar dimensiones
    const dimensionValidation = await this.validateImageDimensions(file);
    if (!dimensionValidation.valid) {
      return dimensionValidation;
    }

    // 3. Analizar calidad
    const qualityValidation = await this.analyzeDocumentQuality(file);
    return qualityValidation;
  }

  /**
   * Genera una vista previa de la imagen
   */
  generatePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Error al generar preview'));
      reader.readAsDataURL(file);
    });
  }
}
