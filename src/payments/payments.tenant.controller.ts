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

@ApiTags('Payments - Tenant')
@ApiBearerAuth()
@Controller(':slug/tenant/payments')
@UseGuards(JwtAuthGuard)
export class PaymentsTenantController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @HttpCode(HttpStatus.OK)
  async getMyPayments(
    @Param('slug') slug: string,
    @CurrentUser() user: any,
    @Query() filters?: FilterPaymentsDto,
  ) {
    return await this.paymentsService.findByTenant(user.userId, filters || {});
  }

  @Get('summary')
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @HttpCode(HttpStatus.OK)
  async getMySummary(@Param('slug') slug: string, @CurrentUser() user: any) {
    return await this.paymentsService.getSummary({ tenantId: user.userId });
  }

  @Get(':id')
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const payment = await this.paymentsService.findOne(id);

    // Verify that the payment belongs to the tenant
    if (payment.tenantId !== user.userId) {
      return {
        statusCode: 403,
        message: 'You can only view your own payments',
      };
    }

    return payment;
  }

  @Post(':id/pay')
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.OK)
  async payMyPayment(
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() payPaymentDto: PayPaymentDto,
    @CurrentUser() user: any,
  ) {
    const payment = await this.paymentsService.findOne(id);

    // Verify that the payment belongs to the tenant
    if (payment.tenantId !== user.userId) {
      return {
        statusCode: 403,
        message: 'You can only pay your own payments',
      };
    }

    return await this.paymentsService.payPayment(id, payPaymentDto, user.userId);
  }
}
