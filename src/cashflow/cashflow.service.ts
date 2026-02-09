import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Cashflow } from './entities/cashflow.entity';
import { CashflowType } from './enums/cashflow-type.enum';
import { CashflowCategory } from './enums/cashflow-category.enum';
import { CashflowReferenceType } from './enums/cashflow-reference-type.enum';
import { CreateCashflowDto } from './dto/create-cashflow.dto';
import { FilterCashflowDto } from './dto/filter-cashflow.dto';
import { CashflowSummaryDto } from './dto/cashflow-summary.dto';

@Injectable()
export class CashflowService {
  private cashflowRepository: Repository<Cashflow>;

  constructor(@InjectDataSource() private dataSource: DataSource) {
    // Initialize repository in methods to use dynamic schema
  }

  private getRepository(): Repository<Cashflow> {
    return this.dataSource.getRepository(Cashflow);
  }

  /**
   * Create a manual cashflow entry
   */
  async create(createCashflowDto: CreateCashflowDto, userId?: number): Promise<Cashflow> {
    const cashflowRepository = this.getRepository();

    const cashflow = cashflowRepository.create({
      type: createCashflowDto.type,
      category: createCashflowDto.category,
      amount: createCashflowDto.amount,
      description: createCashflowDto.description,
      reference_type: CashflowReferenceType.MANUAL,
      referenceId: null,
      transactionDate: new Date(createCashflowDto.transactionDate),
    });

    return await cashflowRepository.save(cashflow);
  }

  /**
   * Create automatic cashflow entry from payment
   */
  async createFromPayment(paymentData: {
    amount: number;
    paymentDate: Date;
    contractId: number;
    tenantId: number;
  }): Promise<Cashflow> {
    const cashflowRepository = this.getRepository();

    // Get contract details for description
    const contractResult = await this.dataSource.query(
      `SELECT c.contract_number, p.title as property_title
       FROM contracts c
       LEFT JOIN properties p ON c.property_id = p.id
       WHERE c.id = $1`,
      [paymentData.contractId],
    );

    const contract = contractResult[0];
    const description = `Pago de renta - Contrato ${contract.contract_number} (${contract.property_title})`;

    const cashflow = cashflowRepository.create({
      type: CashflowType.INGRESO,
      category: CashflowCategory.RENTA,
      amount: paymentData.amount,
      description,
      reference_type: CashflowReferenceType.PAYMENT,
      referenceId: paymentData.contractId,
      transactionDate: new Date(paymentData.paymentDate),
    });

    return await cashflowRepository.save(cashflow);
  }

  /**
   * Create automatic cashflow entry from maintenance
   */
  async createFromMaintenance(maintenanceData: {
    cost: number;
    createdAt: Date;
    maintenanceId: number;
    propertyTitle: string;
  }): Promise<Cashflow> {
    const cashflowRepository = this.getRepository();

    const description = `Gasto de mantenimiento - ${maintenanceData.propertyTitle}`;

    const cashflow = cashflowRepository.create({
      type: CashflowType.EGRESO,
      category: CashflowCategory.MANTENIMIENTO,
      amount: maintenanceData.cost,
      description,
      reference_type: CashflowReferenceType.MAINTENANCE,
      referenceId: maintenanceData.maintenanceId,
      transactionDate: new Date(maintenanceData.createdAt),
    });

    return await cashflowRepository.save(cashflow);
  }

  /**
   * Get all cashflow entries with filters
   */
  async findAll(filters: FilterCashflowDto): Promise<{ data: Cashflow[]; total: number }> {
    const cashflowRepository = this.getRepository();
    const { page = 1, limit = 10, ...whereConditions } = filters;

    const queryBuilder = cashflowRepository.createQueryBuilder('cashflow');

    // Apply filters
    if (filters.type) {
      queryBuilder.andWhere('cashflow.type = :type', { type: filters.type });
    }

    if (filters.category) {
      queryBuilder.andWhere('cashflow.category = :category', { category: filters.category });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('cashflow.transactionDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('cashflow.transactionDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    // Order and pagination
    queryBuilder
      .orderBy('cashflow.transactionDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  /**
   * Get cashflow by ID
   */
  async findOne(id: number): Promise<Cashflow> {
    const cashflowRepository = this.getRepository();
    const cashflow = await cashflowRepository.findOne({ where: { id } });

    if (!cashflow) {
      throw new NotFoundException(`Cashflow entry with ID ${id} not found`);
    }

    return cashflow;
  }

  /**
   * Get current balance
   */
  async getBalance(filters?: FilterCashflowDto): Promise<{
    totalIncome: number;
    totalExpenses: number;
    currentBalance: number;
  }> {
    const cashflowRepository = this.getRepository();

    const queryBuilder = cashflowRepository.createQueryBuilder('cashflow');

    // Apply additional filters if provided
    if (filters?.startDate) {
      queryBuilder.andWhere('cashflow.transactionDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('cashflow.transactionDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    const cashflows = await queryBuilder.getMany();

    const totalIncome = cashflows
      .filter((c) => c.type === CashflowType.INGRESO)
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const totalExpenses = cashflows
      .filter((c) => c.type === CashflowType.EGRESO)
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const currentBalance = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      currentBalance,
    };
  }

  /**
   * Get cashflow summary
   */
  async getSummary(filters?: FilterCashflowDto): Promise<CashflowSummaryDto> {
    const cashflowRepository = this.getRepository();

    const queryBuilder = cashflowRepository.createQueryBuilder('cashflow');

    // Apply additional filters if provided
    if (filters?.startDate) {
      queryBuilder.andWhere('cashflow.transactionDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('cashflow.transactionDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    const cashflows = await queryBuilder.getMany();

    const totalIncome = cashflows
      .filter((c) => c.type === CashflowType.INGRESO)
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const totalExpenses = cashflows
      .filter((c) => c.type === CashflowType.EGRESO)
      .reduce((sum, c) => sum + Number(c.amount), 0);

    return {
      totalIncome,
      totalExpenses,
      currentBalance: totalIncome - totalExpenses,
      transactionCount: cashflows.length,
    };
  }

  /**
   * Get monthly report
   */
  async getMonthlyReport(year: number, month: number): Promise<any> {
    const cashflowRepository = this.getRepository();

    // First day of the month
    const startDate = new Date(year, month - 1, 1);
    // Last day of the month
    const endDate = new Date(year, month, 0);

    const cashflows = await cashflowRepository.find({
      where: {
        transactionDate: {
          $gte: startDate,
          $lte: endDate,
        } as any,
      },
      order: {
        transactionDate: 'ASC',
      },
    });

    // Group by category
    const byCategory = cashflows.reduce((acc, c) => {
      if (!acc[c.category]) {
        acc[c.category] = {
          income: 0,
          expenses: 0,
          count: 0,
        };
      }

      if (c.type === CashflowType.INGRESO) {
        acc[c.category].income += Number(c.amount);
      } else {
        acc[c.category].expenses += Number(c.amount);
      }

      acc[c.category].count++;

      return acc;
    }, {} as Record<string, { income: number; expenses: number; count: number }>);

    return {
      year,
      month,
      startDate,
      endDate,
      byCategory,
      totalTransactions: cashflows.length,
    };
  }
}
