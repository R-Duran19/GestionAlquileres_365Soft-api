import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CashflowService } from './cashflow.service';
import { CreateCashflowDto } from './dto/create-cashflow.dto';
import { FilterCashflowDto } from './dto/filter-cashflow.dto';

@ApiTags('Cashflow - Admin')
@ApiBearerAuth()
@Controller(':slug/admin/cashflow')
@UseGuards(JwtAuthGuard)
export class CashflowController {
  constructor(private readonly cashflowService: CashflowService) {}

  @Get()
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @HttpCode(HttpStatus.OK)
  async findAll(@Param('slug') slug: string, @Query() filters: FilterCashflowDto) {
    return await this.cashflowService.findAll(filters);
  }

  @Post()
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('slug') slug: string,
    @Body() createCashflowDto: CreateCashflowDto,
  ) {
    return await this.cashflowService.create(createCashflowDto);
  }

  @Get('balance')
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @HttpCode(HttpStatus.OK)
  async getBalance(@Param('slug') slug: string, @Query() filters?: FilterCashflowDto) {
    return await this.cashflowService.getBalance(filters);
  }

  @Get('summary')
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @HttpCode(HttpStatus.OK)
  async getSummary(@Param('slug') slug: string, @Query() filters?: FilterCashflowDto) {
    return await this.cashflowService.getSummary(filters);
  }

  @Get('report/:year/:month')
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'year', type: Number })
  @ApiParam({ name: 'month', type: Number })
  @HttpCode(HttpStatus.OK)
  async getMonthlyReport(
    @Param('slug') slug: string,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return await this.cashflowService.getMonthlyReport(year, month);
  }

  @Get(':id')
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('slug') slug: string, @Param('id', ParseIntPipe) id: number) {
    return await this.cashflowService.findOne(id);
  }
}
