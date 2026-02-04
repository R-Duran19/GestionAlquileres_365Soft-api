import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ContractStatus } from './enums/contract-status.enum';
import type { TenantRequest } from '../common/middleware/tenant-context.middleware';

@Controller('admin/contracts')
@UseGuards(JwtAuthGuard)
export class AdminContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.contractsService.getMetrics();
  }

  @Post()
  async create(@Body() createContractDto: CreateContractDto) {
    return this.contractsService.create(createContractDto);
  }

  @Get()
  async findAll(
    @Query('status') status?: ContractStatus,
    @Query('tenant_id', ParseIntPipe) tenant_id?: number,
    @Query('property_id', ParseIntPipe) property_id?: number,
  ) {
    return this.contractsService.findAll({ status, tenant_id, property_id });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contractsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContractDto: UpdateContractDto,
    @Req() req: TenantRequest,
  ) {
    const userId = req.user?.userId || 0;
    return this.contractsService.update(id, updateContractDto, userId);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ContractStatus,
    @Body('reason') reason: string,
    @Req() req: TenantRequest,
  ) {
    const userId = req.user?.userId || 0;
    return this.contractsService.update(
      id,
      { status, update_reason: reason },
      userId,
    );
  }

  @Get(':id/pdf')
  async getPdf(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: TenantRequest,
    @Res() res: Response,
  ) {
    const tenantSlug = req.tenant?.slug || 'default';
    const filePath = await this.contractsService.generatePdf(id, tenantSlug);
    res.download(filePath);
  }

  @Post(':id/renew')
  async renew(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: TenantRequest,
  ) {
    const userId = req.user?.userId || 0;
    return this.contractsService.renew(id, userId);
  }
}

@Controller('tenant/contracts')
@UseGuards(JwtAuthGuard)
export class TenantContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get('my-contracts')
  async findMyContracts(
    @Req() req: TenantRequest,
    @Query('status') status?: ContractStatus,
  ) {
    const tenantId = req.user?.userId || 0;
    return this.contractsService.findAll({ tenant_id: tenantId, status });
  }

  @Get('current')
  async findCurrentContract(@Req() req: TenantRequest) {
    const tenantId = req.user?.userId || 0;
    const contracts = await this.contractsService.findAll({
      tenant_id: tenantId,
      status: ContractStatus.ACTIVO,
    });
    return contracts[0] || null;
  }

  @Get('my-contracts/:id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: TenantRequest,
  ) {
    const contract = await this.contractsService.findOne(id);
    if (contract.tenant_id !== req.user?.userId) {
      throw new Error('No tienes permiso para ver este contrato');
    }
    return contract;
  }

  @Get('my-contracts/:id/pdf')
  async getMyPdf(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: TenantRequest,
    @Res() res: Response,
  ) {
    const contract = await this.contractsService.findOne(id);
    if (contract.tenant_id !== req.user?.userId) {
      throw new Error('No tienes permiso para ver este contrato');
    }

    const tenantSlug = req.tenant?.slug || 'default';
    const filePath = await this.contractsService.generatePdf(id, tenantSlug);
    res.download(filePath);
  }

  @Post('my-contracts/:id/sign')
  async sign(@Param('id', ParseIntPipe) id: number, @Req() req: TenantRequest) {
    const userId = req.user?.userId || 0;
    const ip = req.ip || '0.0.0.0';
    return this.contractsService.signContract(id, userId, ip);
  }
}
