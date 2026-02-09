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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { FilterPaymentsDto } from './dto/filter-payments.dto';
import { PayPaymentDto } from './dto/pay-payment.dto';

@ApiTags('Payments - Admin')
@ApiBearerAuth()
@Controller(':slug/admin/payments')
@UseGuards(JwtAuthGuard)
export class PaymentsAdminController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @HttpCode(HttpStatus.OK)
  async findAll(@Param('slug') slug: string, @Query() filters: FilterPaymentsDto) {
    return await this.paymentsService.findAll(filters);
  }

  @Get('summary')
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @HttpCode(HttpStatus.OK)
  async getSummary(@Param('slug') slug: string, @Query() filters?: FilterPaymentsDto) {
    return await this.paymentsService.getSummary(filters);
  }

  @Get('overdue')
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @HttpCode(HttpStatus.OK)
  async getOverdue(@Param('slug') slug: string) {
    return await this.paymentsService.findOverdue();
  }

  @Get(':id')
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('slug') slug: string, @Param('id', ParseIntPipe) id: number) {
    return await this.paymentsService.findOne(id);
  }

  @Post(':id/pay')
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.OK)
  async payPayment(
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() payPaymentDto: PayPaymentDto,
    @CurrentUser() user: any,
  ) {
    return await this.paymentsService.payPayment(id, payPaymentDto, user.userId);
  }
}
