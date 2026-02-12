import { Module, Global } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { StaticFilesController } from '../controllers/static-files.controller';

@Global()
@Module({
  providers: [FileUploadService],
  controllers: [StaticFilesController],
  exports: [FileUploadService],
})
export class CommonServicesModule { }
