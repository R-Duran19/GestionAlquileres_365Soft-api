import { Injectable, NotFoundException, BadRequestException, Optional, Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository, LessThan, MoreThanOrEqual, Between } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentStatus } from './enums/payment-status.enum';
import { PaymentMethod } from './enums/payment-method.enum';
import { FilterPaymentsDto } from './dto/filter-payments.dto';
import { PaymentSummaryDto } from './dto/payment-summary.dto';
import { PayPaymentDto } from './dto/pay-payment.dto';
import { CashflowService } from '../cashflow/cashflow.service';

@Injectable()
export class PaymentsService {
  private paymentRepository: Repository<Payment>;

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @Optional() private cashflowService?: CashflowService,
  ) {
    // Initialize repository in methods to use dynamic schema
  }

  private getRepository(): Repository<Payment> {
    return this.dataSource.getRepository(Payment);
  }

  /**
   * Create payment plan for a contract (called when tenant signs contract)
   */
  async createPaymentPlan(contractId: number, contractData: {
    tenantId: number;
    propertyId: number;
    monthlyRent: number;
    paymentDay: number;
    graceDays: number;
    startDate: Date;
    endDate: Date;
  }): Promise<Payment[]> {
    const paymentRepository = this.getRepository();
    const payments: Payment[] = [];

    const startDate = new Date(contractData.startDate);
    const endDate = new Date(contractData.endDate);

    // Calculate number of months
    let currentDate = new Date(startDate);
    currentDate.setDate(contractData.paymentDay);

    // If payment day is before start date, move to next month
    if (currentDate < startDate) {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    let paymentNumber = 1;

    while (currentDate <= endDate) {
      const dueDate = new Date(currentDate);
      const gracePeriodEndDate = new Date(dueDate);
      gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + contractData.graceDays);

      const payment = paymentRepository.create({
        contractId,
        tenantId: contractData.tenantId,
        propertyId: contractData.propertyId,
        amount: contractData.monthlyRent,
        dueDate,
        gracePeriodEndDate,
        status: PaymentStatus.PENDIENTE,
        penaltyFee: 0,
        penaltyDays: 0,
        paidAmount: 0,
        isPenaltyApplied: false,
      });

      payments.push(payment);
      paymentNumber++;

      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Save all payments
    const savedPayments = await paymentRepository.save(payments);
    return savedPayments;
  }

  /**
   * Get all payments with filters
   */
  async findAll(filters: FilterPaymentsDto): Promise<{ data: Payment[]; total: number }> {
    const paymentRepository = this.getRepository();
    const { page = 1, limit = 10, ...whereConditions } = filters;

    const queryBuilder = paymentRepository.createQueryBuilder('payment');

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('payment.status = :status', { status: filters.status });
    }

    if (filters.tenantId) {
      queryBuilder.andWhere('payment.tenantId = :tenantId', { tenantId: filters.tenantId });
    }

    if (filters.propertyId) {
      queryBuilder.andWhere('payment.propertyId = :propertyId', { propertyId: filters.propertyId });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('payment.dueDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('payment.dueDate <= :endDate', { endDate: filters.endDate });
    }

    // Order and pagination
    queryBuilder
      .orderBy('payment.dueDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  /**
   * Get payments by tenant ID
   */
  async findByTenant(tenantId: number, filters: FilterPaymentsDto): Promise<{ data: Payment[]; total: number }> {
    const filterWithTenant = { ...filters, tenantId };
    return this.findAll(filterWithTenant);
  }

  /**
   * Get payment by ID
   */
  async findOne(id: number): Promise<Payment> {
    const paymentRepository = this.getRepository();
    const payment = await paymentRepository.findOne({ where: { id } });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  /**
   * Get overdue payments
   */
  async findOverdue(): Promise<Payment[]> {
    const paymentRepository = this.getRepository();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overduePayments = await paymentRepository.find({
      where: {
        status: PaymentStatus.VENCIDO,
      },
      relations: ['contract', 'tenant', 'property'],
      order: {
        dueDate: 'ASC',
      },
    });

    return overduePayments;
  }

  /**
   * Get payment summary
   */
  async getSummary(filters?: FilterPaymentsDto): Promise<PaymentSummaryDto> {
    const paymentRepository = this.getRepository();

    // Base query
    const queryBuilder = paymentRepository.createQueryBuilder('payment');

    // Apply additional filters if provided
    if (filters?.tenantId) {
      queryBuilder.andWhere('payment.tenantId = :tenantId', { tenantId: filters.tenantId });
    }

    if (filters?.propertyId) {
      queryBuilder.andWhere('payment.propertyId = :propertyId', { propertyId: filters.propertyId });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('payment.dueDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('payment.dueDate <= :endDate', { endDate: filters.endDate });
    }

    // Get all payments matching filters
    const payments = await queryBuilder.getMany();

    // Calculate summary
    const summary: PaymentSummaryDto = {
      totalPending: 0,
      totalPaid: 0,
      totalOverdue: 0,
      countPending: 0,
      countPaid: 0,
      countOverdue: 0,
    };

    payments.forEach((payment) => {
      switch (payment.status) {
        case PaymentStatus.PENDIENTE:
        case PaymentStatus.EN_GRACIA:
          summary.totalPending += Number(payment.amount);
          summary.countPending++;
          break;
        case PaymentStatus.PAGADO:
          summary.totalPaid += Number(payment.paidAmount);
          summary.countPaid++;
          break;
        case PaymentStatus.VENCIDO:
          summary.totalOverdue += Number(payment.amount);
          summary.countOverdue++;
          break;
      }
    });

    return summary;
  }

  /**
   * Pay a payment (mark as paid and create cashflow entry)
   */
  async payPayment(
    paymentId: number,
    payPaymentDto: PayPaymentDto,
    userId: number,
    tenantSchema?: string,
  ): Promise<Payment> {
    const payment = await this.findOne(paymentId);

    if (payment.status === PaymentStatus.PAGADO) {
      throw new BadRequestException('Payment is already paid');
    }

    const paymentRepository = this.getRepository();

    // Calculate amount to pay
    const amountToPay = payPaymentDto.amount
      ? payPaymentDto.amount
      : Number(payment.amount) + Number(payment.penaltyFee);

    // Calculate penalty if applicable
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const gracePeriodEnd = new Date(payment.gracePeriodEndDate);
    gracePeriodEnd.setHours(23, 59, 59, 999);

    let penaltyFee = Number(payment.penaltyFee);
    let penaltyDays = 0;

    if (today > gracePeriodEnd && !payment.isPenaltyApplied) {
      // Calculate penalty days
      const diffTime = today.getTime() - gracePeriodEnd.getTime();
      penaltyDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Get contract to calculate penalty percentage
      const contractQuery = `
        SELECT late_fee_percentage
        FROM contracts
        WHERE id = $1
      `;
      const contractResult = await this.dataSource.query(contractQuery, [payment.contractId]);

      if (contractResult.length > 0 && contractResult[0].late_fee_percentage > 0) {
        penaltyFee = Number(payment.amount) * (contractResult[0].late_fee_percentage / 100);
      }
    }

    // Update payment
    payment.status = PaymentStatus.PAGADO;
    payment.paymentDate = new Date();
    payment.paymentMethod = payPaymentDto.paymentMethod;
    payment.paidAmount = amountToPay;
    payment.penaltyFee = penaltyFee;
    payment.penaltyDays = penaltyDays;
    payment.isPenaltyApplied = penaltyFee > 0;
    payment.notes = payPaymentDto.notes || payment.notes;

    const savedPayment = await paymentRepository.save(payment);

    // Create cashflow entry for income
    if (this.cashflowService) {
      try {
        await this.cashflowService.createFromPayment({
          amount: savedPayment.paidAmount,
          paymentDate: savedPayment.paymentDate,
          contractId: savedPayment.contractId,
          tenantId: savedPayment.tenantId,
        });
      } catch (error) {
        console.error('Error creating cashflow entry:', error);
        // Don't throw error, payment is already saved
      }
    }

    return savedPayment;
  }

  /**
   * Update payment statuses (called by scheduler)
   */
  async updatePaymentStatuses(): Promise<void> {
    const paymentRepository = this.getRepository();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all PENDIENTE payments
    const pendingPayments = await paymentRepository.find({
      where: {
        status: PaymentStatus.PENDIENTE,
      },
    });

    for (const payment of pendingPayments) {
      const gracePeriodEnd = new Date(payment.gracePeriodEndDate);
      gracePeriodEnd.setHours(23, 59, 59, 999);

      if (today > gracePeriodEnd) {
        // Past grace period - mark as VENCIDO
        payment.status = PaymentStatus.VENCIDO;

        // Calculate penalty
        const diffTime = today.getTime() - gracePeriodEnd.getTime();
        const penaltyDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Get contract to calculate penalty percentage
        const contractQuery = `
          SELECT late_fee_percentage
          FROM contracts
          WHERE id = $1
        `;
        const contractResult = await this.dataSource.query(contractQuery, [payment.contractId]);

        if (contractResult.length > 0 && contractResult[0].late_fee_percentage > 0) {
          const penaltyFee = Number(payment.amount) * (contractResult[0].late_fee_percentage / 100);
          payment.penaltyFee = penaltyFee;
          payment.penaltyDays = penaltyDays;
          payment.isPenaltyApplied = true;
        }

        await paymentRepository.save(payment);
      } else if (today >= new Date(payment.dueDate)) {
        // Within grace period - mark as EN_GRACIA
        payment.status = PaymentStatus.EN_GRACIA;
        await paymentRepository.save(payment);
      }
    }
  }

  /**
   * Get payments by contract ID
   */
  async findByContract(contractId: number): Promise<Payment[]> {
    const paymentRepository = this.getRepository();
    return paymentRepository.find({
      where: { contractId },
      order: { dueDate: 'ASC' },
    });
  }

  /**
   * Delete all payments by contract ID (used when contract is deleted)
   */
  async deleteByContract(contractId: number): Promise<void> {
    const paymentRepository = this.getRepository();
    await paymentRepository.delete({ contractId });
  }
}
