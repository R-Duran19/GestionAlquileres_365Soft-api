import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const mkdirAsync = promisify(fs.mkdir);
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

@Injectable()
export class FileUploadService {
  private readonly baseUploadPath = path.join(process.cwd(), 'storage');

  /**
   * Guarda múltiples archivos de imágenes de propiedad
   * @param files Array de archivos a guardar
   * @param tenantSlug Slug del tenant
   * @param propertyId ID de la propiedad (opcional, si es nueva propiedad usar 'temp')
   * @returns Array de rutas relativas de los archivos guardados
   */
  async savePropertyImages(
    files: Express.Multer.File[],
    tenantSlug: string,
    propertyId?: number,
  ): Promise<string[]> {
    if (!files || files.length === 0) {
      return [];
    }

    const propertyPath = propertyId ? propertyId.toString() : 'temp';
    const uploadDir = path.join(
      this.baseUploadPath,
      'properties',
      tenantSlug,
      propertyPath,
    );

    // Asegurar que el directorio existe
    await this.ensureDirectoryExists(uploadDir);

    const savedFiles: string[] = [];

    for (const file of files) {
      const timestamp = Date.now();
      const randomString = this.generateRandomString(16);
      const extension = path.extname(file.originalname);
      const filename = `${timestamp}-${randomString}${extension}`;
      const filePath = path.join(uploadDir, filename);

      // Guardar el archivo
      await writeFileAsync(filePath, file.buffer);

      // Guardar ruta relativa
      const relativePath = path.join(
        'storage',
        'properties',
        tenantSlug,
        propertyPath,
        filename,
      );
      savedFiles.push(relativePath.replace(/\\/g, '/')); // Normalizar para URLs
    }

    return savedFiles;
  }

  /**
   * Mueve imágenes temporales a un directorio permanente cuando se conoce el ID
   * @param tempPaths Array de rutas temporales
   * @param tenantSlug Slug del tenant
   * @param propertyId ID real de la propiedad
   * @returns Array de nuevas rutas
   */
  async movePropertyImages(
    tempPaths: string[],
    tenantSlug: string,
    propertyId: number,
  ): Promise<string[]> {
    if (!tempPaths || tempPaths.length === 0) {
      return [];
    }

    const newPaths: string[] = [];
    const newDir = path.join(
      this.baseUploadPath,
      'properties',
      tenantSlug,
      propertyId.toString(),
    );

    await this.ensureDirectoryExists(newDir);

    for (const tempPath of tempPaths) {
      const fullTempPath = path.join(process.cwd(), tempPath);
      const filename = path.basename(tempPath);
      const newFilePath = path.join(newDir, filename);

      // Copiar el archivo
      if (fs.existsSync(fullTempPath)) {
        const fileContent = fs.readFileSync(fullTempPath);
        await writeFileAsync(newFilePath, fileContent);

        // Eliminar el archivo temporal
        await this.deleteFile(fullTempPath);

        // Guardar nueva ruta
        const relativePath = path.join(
          'storage',
          'properties',
          tenantSlug,
          propertyId.toString(),
          filename,
        );
        newPaths.push(relativePath.replace(/\\/g, '/'));
      } else {
        // Si no existe el temporal, mantener la ruta original
        newPaths.push(tempPath);
      }
    }

    return newPaths;
  }

  /**
   * Elimina un archivo
   * @param filePath Ruta completa del archivo
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await unlinkAsync(filePath);
      }
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
    }
  }

  /**
   * Elimina múltiples archivos de propiedad
   * @param imagePaths Array de rutas relativas
   */
  async deletePropertyImages(imagePaths: string[]): Promise<void> {
    for (const imagePath of imagePaths) {
      const fullPath = path.join(process.cwd(), imagePath);
      await this.deleteFile(fullPath);
    }
  }

  /**
   * Genera un string aleatorio
   * @param length Longitud del string
   * @returns String aleatorio
   */
  private generateRandomString(length: number): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Asegura que un directorio existe, creándolo si es necesario
   * @param dirPath Ruta del directorio
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      await mkdirAsync(dirPath, { recursive: true });
    }
  }

  /**
   * Valida que un archivo sea una imagen
   * @param mimetype MIME type del archivo
   * @returns true si es una imagen válida
   */
  isValidImage(mimetype: string): boolean {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    return allowedMimes.includes(mimetype);
  }

  /**
   * Obtiene la URL pública de un archivo
   * @param relativePath Ruta relativa del archivo
   * @param baseUrl URL base del servidor
   * @returns URL completa del archivo
   */
  getPublicUrl(relativePath: string, baseUrl: string): string {
    return `${baseUrl}/${relativePath}`;
  }
}
