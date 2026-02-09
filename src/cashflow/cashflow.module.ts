import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashflowService } from './cashflow.service';
import { CashflowController } from './cashflow.controller';
import { Cashflow } from './entities/cashflow.entity';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cashflow]),
    forwardRef(() => PaymentsModule),
  ],
  controllers: [CashflowController],
  providers: [CashflowService],
  exports: [CashflowService],
})
export class CashflowModule {}
