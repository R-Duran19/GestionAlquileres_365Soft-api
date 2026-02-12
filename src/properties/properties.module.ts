import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertiesService } from './properties.service';
import {
  AdminPropertiesController,
  PublicPropertiesController,
  TenantPropertiesController,
} from './properties.controller';
import { Property } from './entities/property.entity';
import { PropertyType } from './entities/property-type.entity';
import { PropertySubtype } from './entities/property-subtype.entity';
import { PropertyAddress } from './entities/property-address.entity';
import { RentalOwner } from './entities/rental-owner.entity';
import { PropertyOwner } from './entities/property-owner.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommonServicesModule } from '../common/services/common-services.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Property,
      PropertyType,
      PropertySubtype,
      PropertyAddress,
      RentalOwner,
      PropertyOwner,
    ]),
    NotificationsModule,
    CommonServicesModule,
  ],
  providers: [PropertiesService],
  controllers: [
    AdminPropertiesController,
    PublicPropertiesController,
    TenantPropertiesController,
  ],
  exports: [PropertiesService],
})
export class PropertiesModule { }
