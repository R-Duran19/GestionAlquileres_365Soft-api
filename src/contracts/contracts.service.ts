import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Contract } from './entities/contract.entity';
import { ContractHistory } from './entities/contract-history.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { ContractStatus } from './enums/contract-status.enum';
import { PdfService } from './pdf.service';

@Injectable()
export class ContractsService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private pdfService: PdfService,
  ) {}

  private getContractRepository(): Repository<Contract> {
    return this.dataSource.getRepository(Contract);
  }

  private getHistoryRepository(): Repository<ContractHistory> {
    return this.dataSource.getRepository(ContractHistory);
  }

  private async getActiveSchema(): Promise<string> {
    const result =
      await this.dataSource.query<{ search_path: string }[]>(
        'SHOW search_path',
      );
    return result[0].search_path.split(',')[0].trim();
  }

  private async generateContractNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CTR-${year}-`;

    const lastContract = await this.dataSource.query<
      { contract_number: string }[]
    >(
      `SELECT contract_number FROM contracts 
       WHERE contract_number LIKE $1 
       ORDER BY contract_number DESC LIMIT 1`,
      [`${prefix}%`],
    );

    let nextNumber = 1;
    if (lastContract.length > 0) {
      const parts = lastContract[0].contract_number.split('-');
      nextNumber = parseInt(parts[2], 10) + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  async create(createContractDto: CreateContractDto) {
    // 1. Validar que la propiedad esté disponible
    const property = await this.dataSource.query<{ status: string }[]>(
      'SELECT status FROM properties WHERE id = $1',
      [createContractDto.property_id],
    );

    if (property.length === 0) {
      throw new NotFoundException(
        `Propiedad con ID ${createContractDto.property_id} no encontrada`,
      );
    }

    if (property[0].status !== 'DISPONIBLE') {
      throw new BadRequestException(
        'La propiedad no está disponible para un nuevo contrato',
      );
    }

    // 2. Generar número de contrato
    const contractNumber = await this.generateContractNumber();

    // 3. Calcular duración en meses si se proporcionan las fechas
    const startDate = new Date(createContractDto.start_date);
    const endDate = new Date(createContractDto.end_date);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const durationMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44));

    // 4. Crear contrato
    const contractRepo = this.getContractRepository();
    const newContract = contractRepo.create({
      ...createContractDto,
      contract_number: contractNumber,
      duration_months: durationMonths,
      status: ContractStatus.BORRADOR,
    });

    const savedContract = await contractRepo.save(newContract);

    // 5. Registrar en historial
    await this.logHistory(
      savedContract.id,
      'status',
      null,
      ContractStatus.BORRADOR,
      0,
      'Creación de contrato',
    );

    return savedContract;
  }

  async findAll(filters: {
    status?: ContractStatus;
    tenant_id?: number;
    property_id?: number;
  }) {
    const query = this.getContractRepository()
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.property', 'property');

    if (filters.status) {
      query.andWhere('contract.status = :status', { status: filters.status });
    }

    if (filters.tenant_id) {
      query.andWhere('contract.tenant_id = :tenant_id', {
        tenant_id: filters.tenant_id,
      });
    }

    if (filters.property_id) {
      query.andWhere('contract.property_id = :property_id', {
        property_id: filters.property_id,
      });
    }

    query.orderBy('contract.created_at', 'DESC');

    return query.getMany();
  }

  async findOne(id: number) {
    const contract = await this.getContractRepository().findOne({
      where: { id },
      relations: ['property', 'property.addresses'],
    });

    if (!contract) {
      throw new NotFoundException(`Contrato con ID ${id} no encontrado`);
    }

    return contract;
  }

  async update(
    id: number,
    updateContractDto: UpdateContractDto,
    userId: number = 0,
  ) {
    const contract = await this.findOne(id);
    const oldStatus = contract.status;

    Object.assign(contract, updateContractDto);

    const savedContract = await this.getContractRepository().save(contract);

    if (updateContractDto.status && updateContractDto.status !== oldStatus) {
      await this.logHistory(
        id,
        'status',
        oldStatus,
        updateContractDto.status,
        userId,
        updateContractDto.update_reason || 'Cambio de estado',
      );

      // Si pasa a ACTIVO, marcar la propiedad como OCUPADA
      if (updateContractDto.status === ContractStatus.ACTIVO) {
        await this.dataSource.query(
          "UPDATE properties SET status = 'OCUPADO' WHERE id = $1",
          [contract.property_id],
        );
      }

      // Si pasa a FINALIZADO, VENCIDO o CANCELADO, marcar como DISPONIBLE
      if (
        [
          ContractStatus.FINALIZADO,
          ContractStatus.VENCIDO,
          ContractStatus.CANCELADO,
        ].includes(updateContractDto.status)
      ) {
        await this.dataSource.query(
          "UPDATE properties SET status = 'DISPONIBLE' WHERE id = $1",
          [contract.property_id],
        );
      }
    }

    return savedContract;
  }

  async signContract(id: number, userId: number, ip: string) {
    const contract = await this.findOne(id);

    if (contract.tenant_id !== userId) {
      throw new BadRequestException(
        'No tienes permiso para firmar este contrato',
      );
    }

    if (
      contract.status !== ContractStatus.BORRADOR &&
      contract.status !== ContractStatus.PENDIENTE
    ) {
      throw new BadRequestException(
        'El contrato no está en un estado que permita firma',
      );
    }

    const oldStatus = contract.status;
    contract.status = ContractStatus.ACTIVO;
    contract.tenant_signature_date = new Date();
    contract.activation_date = new Date();
    contract.signed_ip = ip;

    const savedContract = await this.getContractRepository().save(contract);

    await this.logHistory(
      id,
      'status',
      oldStatus,
      ContractStatus.ACTIVO,
      userId,
      'Firma digital del inquilino (Aceptación de términos)',
    );

    // Marcar propiedad como ocupada
    await this.dataSource.query(
      "UPDATE properties SET status = 'OCUPADO' WHERE id = $1",
      [contract.property_id],
    );

    return savedContract;
  }

  async getMetrics() {
    const activeContracts = await this.dataSource.query<{ total: string }[]>(
      "SELECT COUNT(*) as total FROM contracts WHERE status = 'ACTIVO'",
    );

    const expiringSoon = await this.dataSource.query<{ total: string }[]>(
      `SELECT COUNT(*) as total FROM contracts 
       WHERE status = 'ACTIVO' 
       AND end_date <= CURRENT_DATE + INTERVAL '30 days'`,
    );

    const monthlyRevenue = await this.dataSource.query<{ total: string }[]>(
      "SELECT SUM(monthly_rent) as total FROM contracts WHERE status = 'ACTIVO'",
    );

    return {
      active_contracts: parseInt(activeContracts[0].total, 10),
      expiring_soon_30_days: parseInt(expiringSoon[0].total, 10),
      monthly_recurring_revenue: parseFloat(monthlyRevenue[0].total || '0'),
    };
  }

  private async logHistory(
    contractId: number,
    field: string,
    oldValue: any,
    newValue: any,
    userId: number,
    reason?: string,
  ) {
    const historyRepo = this.getHistoryRepository();
    const entry = new ContractHistory();
    entry.contract_id = contractId;
    entry.field_modified = field;
    entry.old_value = oldValue ? String(oldValue) : null;
    entry.new_value = newValue ? String(newValue) : null;
    entry.modified_by = userId;
    entry.reason = reason || null;

    await historyRepo.save(entry);
  }

  async generatePdf(id: number, tenantSlug: string) {
    const contract = await this.findOne(id);

    // Obtener información del tenant (empresa) desde el schema public
    const tenantInfo = await this.dataSource.query<
      { company_name: string; logo_url?: string }[]
    >('SELECT company_name, logo_url FROM public.tenant WHERE slug = $1', [
      tenantSlug,
    ]);

    const pdfPath = await this.pdfService.generateContractPdf(contract, {
      name: tenantInfo[0]?.company_name || 'Empresa Administradora',
      address: 'Dirección de la administración', // Opcional: podrías guardarlo en el Tenant metadata
    });

    // Actualizar URL del PDF en el contrato
    const relativePath = pdfPath.split('uploads')[1].replace(/\\/g, '/');
    const pdfUrl = `/uploads${relativePath}`;

    await this.getContractRepository().update(id, { pdf_url: pdfUrl });

    return pdfPath;
  }

  async renew(id: number, userId: number = 0) {
    const oldContract = await this.findOne(id);

    if (
      oldContract.status !== ContractStatus.ACTIVO &&
      oldContract.status !== ContractStatus.POR_VENCER
    ) {
      throw new BadRequestException(
        'Solo se pueden renovar contratos activos o por vencer',
      );
    }

    // Calcular nuevas fechas
    const newStartDate = new Date(oldContract.end_date);
    newStartDate.setDate(newStartDate.getDate() + 1);

    const newEndDate = new Date(newStartDate);
    newEndDate.setMonth(
      newEndDate.getMonth() + (oldContract.duration_months || 12),
    );

    // Aplicar aumento si existe
    const newRent =
      oldContract.monthly_rent *
      (1 + oldContract.auto_increase_percentage / 100);

    const newContractNumber = await this.generateContractNumber();

    const contractRepo = this.getContractRepository();
    const newContract = contractRepo.create({
      ...oldContract,
      id: undefined,
      contract_number: newContractNumber,
      start_date: newStartDate,
      end_date: newEndDate,
      monthly_rent: newRent,
      status: ContractStatus.BORRADOR,
      previous_contract_id: oldContract.id,
      created_at: undefined,
      updated_at: undefined,
    });

    const savedContract = await contractRepo.save(newContract);

    // Actualizar estado del anterior
    await contractRepo.update(id, { status: ContractStatus.RENOVADO });

    await this.logHistory(
      id,
      'status',
      oldContract.status,
      ContractStatus.RENOVADO,
      userId,
      'Contrato renovado',
    );
    await this.logHistory(
      savedContract.id,
      'status',
      null,
      ContractStatus.BORRADOR,
      userId,
      'Creado por renovación',
    );

    return savedContract;
  }
}
