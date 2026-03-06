import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DocumentValidationService, DocumentValidationResult } from './document-validation.service';
import { ToastrService } from 'ngx-toastr'; // O tu servicio de notificaciones

@Component({
  selector: 'app-document-upload',
  templateUrl: './document-upload.component.html',
  styleUrls: ['./document-upload.component.scss']
})
export class DocumentUploadComponent implements OnInit {
  @ViewChild('fileInputFrente') fileInputFrente: ElementRef<HTMLInputElement>;
  @ViewChild('fileInputReverso') fileInputReverso: ElementRef<HTMLInputElement>;

  form: FormGroup;
  
  // Para mostrar previsualizaciones
  frentePreview: string | null = null;
  reversoPreview: string | null = null;
  
  // Para mostrar estado de validación
  frenteValidation: DocumentValidationResult | null = null;
  reversoValidation: DocumentValidationResult | null = null;
  
  // Estados de carga
  isUploadingFrente = false;
  isUploadingReverso = false;
  isValidatingFrente = false;
  isValidatingReverso = false;

  // Archivos seleccionados
  selectedFileFrente: File | null = null;
  selectedFileReverso: File | null = null;

  constructor(
    private fb: FormBuilder,
    private documentValidation: DocumentValidationService,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      frente: [null],
      reverso: [null]
    });
  }

  ngOnInit(): void {}

  /**
   * Maneja selección de archivo FRENTE
   */
  async onFileSelectedFrente(event: any): Promise<void> {
    const file: File = event.target.files?.[0];
    
    if (!file) return;

    this.isValidatingFrente = true;
    this.frenteValidation = null;
    this.selectedFileFrente = null;
    this.frentePreview = null;

    try {
      // Validación completa
      const validation = await this.documentValidation.validateCompleteDocument(file);
      this.frenteValidation = validation;

      if (!validation.valid) {
        this.toastr.error(validation.error || 'Documento inválido', 'Error de validación');
        this.resetFileInput(this.fileInputFrente);
        return;
      }

      // Mostrar warning si existe
      if (validation.warning) {
        this.toastr.warning(validation.warning, 'Advertencia');
      }

      // Generar preview
      const preview = await this.documentValidation.generatePreview(file);
      this.frentePreview = preview;
      this.selectedFileFrente = file;
      this.toastr.success('✅ Documento válido', 'Frente');

    } catch (error) {
      this.toastr.error('Error al validar documento', 'Error');
      this.resetFileInput(this.fileInputFrente);
    } finally {
      this.isValidatingFrente = false;
    }
  }

  /**
   * Maneja selección de archivo REVERSO
   */
  async onFileSelectedReverso(event: any): Promise<void> {
    const file: File = event.target.files?.[0];
    
    if (!file) return;

    this.isValidatingReverso = true;
    this.reversoValidation = null;
    this.selectedFileReverso = null;
    this.reversoPreview = null;

    try {
      // Validación completa
      const validation = await this.documentValidation.validateCompleteDocument(file);
      this.reversoValidation = validation;

      if (!validation.valid) {
        this.toastr.error(validation.error || 'Documento inválido', 'Error de validación');
        this.resetFileInput(this.fileInputReverso);
        return;
      }

      // Mostrar warning si existe
      if (validation.warning) {
        this.toastr.warning(validation.warning, 'Advertencia');
      }

      // Generar preview
      const preview = await this.documentValidation.generatePreview(file);
      this.reversoPreview = preview;
      this.selectedFileReverso = file;
      this.toastr.success('✅ Documento válido', 'Reverso');

    } catch (error) {
      this.toastr.error('Error al validar documento', 'Error');
      this.resetFileInput(this.fileInputReverso);
    } finally {
      this.isValidatingReverso = false;
    }
  }

  /**
   * Limpia un archivo input
   */
  private resetFileInput(fileInput: ElementRef<HTMLInputElement>): void {
    if (fileInput) {
      fileInput.nativeElement.value = '';
    }
  }

  /**
   * Abre diálogo de selección de archivo
   */
  triggerFileInputFrente(): void {
    this.fileInputFrente?.nativeElement?.click();
  }

  triggerFileInputReverso(): void {
    this.fileInputReverso?.nativeElement?.click();
  }

  /**
   * Limpia documento seleccionado
   */
  clearFrente(): void {
    this.selectedFileFrente = null;
    this.frentePreview = null;
    this.frenteValidation = null;
    this.resetFileInput(this.fileInputFrente);
  }

  clearReverso(): void {
    this.selectedFileReverso = null;
    this.reversoPreview = null;
    this.reversoValidation = null;
    this.resetFileInput(this.fileInputReverso);
  }

  /**
   * Valida si ambos documentos están listos
   */
  get isReadyToExtract(): boolean {
    return !!(
      this.selectedFileFrente && 
      this.selectedFileReverso &&
      this.frenteValidation?.valid &&
      this.reversoValidation?.valid
    );
  }

  /**
   * Envía los documentos para OCR
   */
  async extractDataFromDocuments(): Promise<void> {
    if (!this.isReadyToExtract) {
      this.toastr.error('Carga ambos documentos válidos', 'Error');
      return;
    }

    // Tu lógica de OCR aquí
    // this.ocrService.extractFromDocuments(this.selectedFileFrente, this.selectedFileReverso)
  }
}
