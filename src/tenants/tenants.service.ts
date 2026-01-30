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
      // 1. Crear el schema en PostgreSQL
      await this.dataSource.query(
        `CREATE SCHEMA IF NOT EXISTS ${tenant.schema_name}`
      );

      // 2. Crear el ENUM de user_role en el nuevo schema
      await this.dataSource.query(`
        DO $$ BEGIN
          CREATE TYPE ${tenant.schema_name}.user_role_enum AS ENUM ('ADMIN', 'INQUILINO');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // 3. Crear el ENUM de property_status en el nuevo schema
      await this.dataSource.query(`
        DO $$ BEGIN
          CREATE TYPE ${tenant.schema_name}.property_status_enum AS ENUM ('DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO', 'RESERVADO');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // 4. Crear el ENUM de property_type en el nuevo schema
      await this.dataSource.query(`
        DO $$ BEGIN
          CREATE TYPE ${tenant.schema_name}.property_type_enum AS ENUM ('departamento', 'casa', 'local', 'oficina', 'terreno');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // 5. Crear la tabla user en el nuevo schema
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS ${tenant.schema_name}."user" (
          id SERIAL PRIMARY KEY,
          email character varying NOT NULL UNIQUE,
          password character varying NOT NULL,
          name character varying NOT NULL,
          phone character varying,
          role user_role_enum NOT NULL DEFAULT 'INQUILINO',
          is_active boolean NOT NULL DEFAULT true,
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now()
        );
      `);

      // 6. Crear índices en la tabla user
      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS IDX_USER_EMAIL ON ${tenant.schema_name}."user"(email);
      `);
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
