import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private dataSource: DataSource,
  ) {}

  async create(createTenantDto: CreateTenantDto) {
    // Verificar si ya existe el slug
    const existingSlug = await this.tenantRepository.findOne({
      where: { slug: createTenantDto.slug },
    });

    if (existingSlug) {
      throw new BadRequestException(`Tenant with slug '${createTenantDto.slug}' already exists`);
    }

    // Generar schema_name a partir del slug
    const schema_name = `tenant_${createTenantDto.slug.replace(/-/g, '_')}`;

    // Verificar si ya existe el schema_name
    const existingSchema = await this.tenantRepository.findOne({
      where: { schema_name },
    });

    if (existingSchema) {
      throw new BadRequestException(`Schema '${schema_name}' already exists`);
    }

    const tenant = this.tenantRepository.create({
      ...createTenantDto,
      schema_name,
    });

    const savedTenant = await this.tenantRepository.save(tenant);

    // Crear el schema en PostgreSQL
    await this.createTenantSchema(savedTenant);

    return savedTenant;
  }

  async findAll() {
    return this.tenantRepository.find();
  }

  async findOne(id: number) {
    const tenant = await this.tenantRepository.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.tenantRepository.findOne({ where: { slug } });

    if (!tenant) {
      throw new NotFoundException(`Tenant with slug '${slug}' not found`);
    }

    return tenant;
  }

  async update(id: number, updateTenantDto: UpdateTenantDto) {
    const tenant = await this.findOne(id); // Verify exists

    // Si se cambia el slug, actualizar también el schema_name
    const updateData: any = { ...updateTenantDto };

    if (updateTenantDto.slug) {
      updateData.schema_name = `tenant_${updateTenantDto.slug.replace(/-/g, '_')}`;
    }

    await this.tenantRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    const tenant = await this.findOne(id);

    // Opcional: Eliminar el schema de PostgreSQL
    await this.dropTenantSchema(tenant);

    await this.tenantRepository.delete(id);

    return { message: 'Tenant deleted successfully' };
  }

  private async createTenantSchema(tenant: Tenant) {
    try {
      // Crear el schema en PostgreSQL
      await this.dataSource.query(
        `CREATE SCHEMA IF NOT EXISTS ${tenant.schema_name}`
      );

      // TODO: Ejecutar migraciones en el nuevo schema
      // Por ahora, las tablas se crearán automáticamente con synchronize: true
      // cuando se haga la primera conexión al schema
    } catch (error) {
      throw new BadRequestException(`Failed to create schema: ${error.message}`);
    }
  }

  private async dropTenantSchema(tenant: Tenant) {
    try {
      // Eliminar el schema de PostgreSQL (CASCADE elimina todas las tablas)
      await this.dataSource.query(
        `DROP SCHEMA IF EXISTS ${tenant.schema_name} CASCADE`
      );
    } catch (error) {
      throw new BadRequestException(`Failed to drop schema: ${error.message}`);
    }
  }
}
