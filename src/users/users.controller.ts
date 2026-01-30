import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('ADMIN')
  async findAll(@CurrentTenant() tenant: any) {
    if (!tenant) {
      throw new Error('Tenant no encontrado en el request');
    }

    return await this.usersService.findAll(tenant.schema_name);
  }
}
