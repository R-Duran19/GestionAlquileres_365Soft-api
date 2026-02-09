import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentsService } from './payments.service';

/**
 * Scheduler for automatic payment status updates
 * Runs daily at midnight (La Paz timezone UTC-4)
 */
@Injectable()
export class PaymentsScheduler {
  private readonly logger = new Logger(PaymentsScheduler.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Update payment statuses daily at midnight La Paz time (UTC-4)
   * Cron expression: 0 0 4 * * * (Every day at 00:00 UTC-4)
   *
   * This job:
   * 1. Marks overdue payments (past grace period)
   * 2. Marks payments in grace period
   * 3. Calculates penalty fees
   * 4. Updates payment status
   */
  @Cron('0 0 4 * * *', {
    name: 'update-payment-statuses',
    timeZone: 'America/La_Paz',
  })
  async handleUpdatePaymentStatuses() {
    this.logger.log('Starting payment status update job...');

    try {
      await this.paymentsService.updatePaymentStatuses();
      this.logger.log('Payment status update job completed successfully');
    } catch (error) {
      this.logger.error('Error updating payment statuses:', error);
      throw error;
    }
  }

  /**
   * Optional: Run every hour to check for urgent updates
   * Can be enabled if needed
   */
  // @Cron(CronExpression.EVERY_HOUR, {
  //   name: 'hourly-payment-check',
  //   timeZone: 'America/La_Paz',
  // })
  // async hourlyPaymentCheck() {
  //   this.logger.debug('Running hourly payment check...');
  //   await this.paymentsService.updatePaymentStatuses();
  // }
}
