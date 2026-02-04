import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceService } from './maintenance.service';
import {
  AdminMaintenanceController,
  TenantMaintenanceController,
} from './maintenance.controller';
import { MaintenanceRequest } from './entities/maintenance-request.entity';
import { MaintenanceMessage } from './entities/maintenance-message.entity';
import { MaintenanceAttachment } from './entities/maintenance-attachment.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MaintenanceRequest,
      MaintenanceMessage,
      MaintenanceAttachment,
      Contract,
    ]),
    NotificationsModule,
  ],
  controllers: [AdminMaintenanceController, TenantMaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
