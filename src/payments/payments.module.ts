import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentsService } from './payments.service';
import { PaymentsAdminController } from './payments.controller';
import { PaymentsTenantController } from './payments.tenant.controller';
import { PaymentsScheduler } from './payments.scheduler';
import { Payment } from './entities/payment.entity';
import { CashflowModule } from '../cashflow/cashflow.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    ScheduleModule.forRoot(),
    forwardRef(() => CashflowModule),
  ],
  controllers: [PaymentsAdminController, PaymentsTenantController],
  providers: [PaymentsService, PaymentsScheduler],
  exports: [PaymentsService],
})
export class PaymentsModule {}
