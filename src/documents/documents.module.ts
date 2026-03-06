import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { OcrService } from './ocr.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, OcrService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
