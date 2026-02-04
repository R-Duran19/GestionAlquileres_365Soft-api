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
import { ApiTags, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ContractStatus } from './enums/contract-status.enum';
import type { TenantRequest } from '../common/middleware/tenant-context.middleware';

@ApiTags('Contracts - Admin')
@ApiBearerAuth()
@Controller(':slug/admin/contracts')
@UseGuards(JwtAuthGuard)
export class AdminContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get('dashboard')
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  async getDashboard(@Param('slug') slug: string) {
    return this.contractsService.getMetrics();
  }

  @Post()
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  async create(@Param('slug') slug: string, @Body() createContractDto: CreateContractDto) {
    return this.contractsService.create(createContractDto);
  }

  @Get()
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  async findAll(
    @Param('slug') slug: string,
    @Query('status') status?: ContractStatus,
    @Query('tenant_id', ParseIntPipe) tenant_id?: number,
    @Query('property_id', ParseIntPipe) property_id?: number,
  ) {
    return this.contractsService.findAll({ status, tenant_id, property_id });
  }

  @Get(':id')
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'id', type: Number })
  async findOne(@Param('slug') slug: string, @Param('id', ParseIntPipe) id: number) {
    return this.contractsService.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'id', type: Number })
  async update(
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContractDto: UpdateContractDto,
    @Req() req: TenantRequest,
  ) {
    const currentUserId = req.user?.userId || 0;
    return this.contractsService.update(id, updateContractDto, currentUserId);
  }

  @Patch(':id/status')
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'id', type: Number })
  async updateStatus(
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ContractStatus,
    @Body('reason') reason: string,
    @Req() req: TenantRequest,
  ) {
    const currentUserId = req.user?.userId || 0;
    return this.contractsService.update(
      id,
      { status, update_reason: reason },
      currentUserId,
    );
  }

  @Get(':id/pdf')
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'id', type: Number })
  async getPdf(
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: TenantRequest,
    @Res() res: Response,
  ) {
    const tenantSlug = req.tenant?.slug || 'default';
    const filePath = await this.contractsService.generatePdf(id, tenantSlug);
    res.download(filePath);
  }

  @Post(':id/renew')
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'id', type: Number })
  async renew(
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: TenantRequest,
  ) {
    const currentUserId = req.user?.userId || 0;
    return this.contractsService.renew(id, currentUserId);
  }
}

@ApiTags('Contracts - Tenant')
@ApiBearerAuth()
@Controller(':slug/tenant/contracts')
@UseGuards(JwtAuthGuard)
export class TenantContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  async findMyContracts(
    @Param('slug') slug: string,
    @Req() req: TenantRequest,
    @Query('status') status?: ContractStatus,
  ) {
    const currentUserId = req.user?.userId || 0;
    return this.contractsService.findAll({ tenant_id: currentUserId, status });
  }

  @Get('current')
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  async findCurrentContract(@Param('slug') slug: string, @Req() req: TenantRequest) {
    const currentUserId = req.user?.userId || 0;
    const contracts = await this.contractsService.findAll({
      tenant_id: currentUserId,
      status: ContractStatus.ACTIVO,
    });
    return contracts[0] || null;
  }

  @Get(':id')
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'id', type: Number })
  async findOne(
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: TenantRequest,
  ) {
    const contract = await this.contractsService.findOne(id);
    if (contract.tenant_id !== req.user?.userId) {
      throw new Error('No tienes permiso para ver este contrato');
    }
    return contract;
  }

  @Get(':id/pdf')
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'id', type: Number })
  async getMyPdf(
    @Param('slug') slug: string,
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

  @Post(':id/sign')
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'id', type: Number })
  async sign(@Param('slug') slug: string, @Param('id', ParseIntPipe) id: number, @Req() req: TenantRequest) {
    const currentUserId = req.user?.userId || 0;
    const ip = req.ip || '0.0.0.0';
    return this.contractsService.signContract(id, currentUserId, ip);
  }
}
