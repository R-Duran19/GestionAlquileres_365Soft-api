import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller(':slug/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obtener todos los usuarios del tenant' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  async findAll(@Param('slug') slug: string, @CurrentTenant() tenant: any) {
    if (!tenant) {
      throw new Error('Tenant no encontrado en el request');
    }

    return await this.usersService.findAll(tenant.schema_name);
  }
}
