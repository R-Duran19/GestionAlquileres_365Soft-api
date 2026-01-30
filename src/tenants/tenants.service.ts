import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tenant } from './metadata/tenant.entity';
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
      throw new BadRequestException(
        `Tenant with slug '${createTenantDto.slug}' already exists`,
      );
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
        `CREATE SCHEMA IF NOT EXISTS ${tenant.schema_name}`,
      );

      // 2. Crear ENUMs necesarios
      // ENUM de user_role
      await this.dataSource.query(`
        DO $$ BEGIN
          CREATE TYPE ${tenant.schema_name}.user_role_enum AS ENUM ('ADMIN', 'INQUILINO');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // 3. Crear la tabla user
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS ${tenant.schema_name}."user" (
          id SERIAL PRIMARY KEY,
          email character varying NOT NULL UNIQUE,
          password character varying NOT NULL,
          name character varying NOT NULL,
          phone character varying,
          role ${tenant.schema_name}.user_role_enum NOT NULL DEFAULT 'INQUILINO',
          is_active boolean NOT NULL DEFAULT true,
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now()
        );
      `);

      // 4. Crear índices en user
      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS IDX_USER_EMAIL ON ${tenant.schema_name}."user"(email);
      `);

      // 5. Crear tablas de Properties
      await this.createPropertiesTables(tenant.schema_name);

      // 6. Insertar datos iniciales (seed data)
      await this.seedPropertyTypesAndSubtypes(tenant.schema_name);
    } catch (error) {
      throw new BadRequestException(
        `Failed to create schema: ${error.message}`,
      );
    }
  }

  private async createPropertiesTables(schemaName: string) {
    // Tabla: property_types
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.property_types (
        id SERIAL PRIMARY KEY,
        name character varying NOT NULL,
        code character varying NOT NULL UNIQUE,
        is_active boolean NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // Tabla: property_subtypes
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.property_subtypes (
        id SERIAL PRIMARY KEY,
        property_type_id integer NOT NULL,
        name character varying NOT NULL,
        code character varying NOT NULL UNIQUE,
        is_active boolean NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT fk_property_subtypes_type FOREIGN KEY (property_type_id)
          REFERENCES ${schemaName}.property_types(id)
      );
    `);

    // Tabla: rental_owners
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.rental_owners (
        id SERIAL PRIMARY KEY,
        name character varying NOT NULL,
        company_name character varying,
        is_company boolean,
        primary_email character varying NOT NULL,
        phone_number character varying NOT NULL,
        secondary_email character varying,
        secondary_phone character varying,
        notes text DEFAULT '',
        is_active boolean NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // Tabla: properties
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.properties (
        id SERIAL PRIMARY KEY,
        title character varying NOT NULL,
        description character varying,
        property_type_id integer NOT NULL,
        property_subtype_id integer NOT NULL,
        status character varying NOT NULL DEFAULT 'DISPONIBLE',
        latitude decimal(10,8),
        longitude decimal(11,8),
        images text[] DEFAULT '{}',
        security_deposit_amount decimal(10,2),
        amenities json DEFAULT '[]',
        included_items json DEFAULT '[]',
        account_number character varying,
        account_type character varying,
        account_holder_name character varying,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT fk_properties_type FOREIGN KEY (property_type_id)
          REFERENCES ${schemaName}.property_types(id),
        CONSTRAINT fk_properties_subtype FOREIGN KEY (property_subtype_id)
          REFERENCES ${schemaName}.property_subtypes(id),
        CONSTRAINT chk_properties_status
          CHECK (status IN ('DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO', 'RESERVADO', 'INACTIVO'))
      );
    `);

    // Tabla: property_addresses
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.property_addresses (
        id SERIAL PRIMARY KEY,
        property_id integer NOT NULL,
        address_type character varying NOT NULL,
        street_address character varying NOT NULL,
        city character varying,
        state character varying,
        zip_code character varying,
        country character varying NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT fk_property_addresses_property FOREIGN KEY (property_id)
          REFERENCES ${schemaName}.properties(id) ON DELETE CASCADE,
        CONSTRAINT chk_property_addresses_type
          CHECK (address_type IN ('address_1', 'address_2', 'address_3'))
      );
    `);

    // Tabla: property_owners
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.property_owners (
        id SERIAL PRIMARY KEY,
        property_id integer NOT NULL,
        rental_owner_id integer NOT NULL,
        ownership_percentage integer NOT NULL DEFAULT 0,
        is_primary boolean NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT fk_property_owners_property FOREIGN KEY (property_id)
          REFERENCES ${schemaName}.properties(id) ON DELETE CASCADE,
        CONSTRAINT fk_property_owners_owner FOREIGN KEY (rental_owner_id)
          REFERENCES ${schemaName}.rental_owners(id),
        CONSTRAINT chk_ownership_percentage
          CHECK (ownership_percentage >= 0 AND ownership_percentage <= 100)
      );
    `);

    // Crear índices para optimizar consultas
    await this.dataSource.query(`
      CREATE INDEX IF NOT EXISTS IDX_PROPERTIES_TYPE ON ${schemaName}.properties(property_type_id);
      CREATE INDEX IF NOT EXISTS IDX_PROPERTIES_SUBTYPE ON ${schemaName}.properties(property_subtype_id);
      CREATE INDEX IF NOT EXISTS IDX_PROPERTIES_STATUS ON ${schemaName}.properties(status);
      CREATE INDEX IF NOT EXISTS IDX_PROPERTY_ADDRESSES_PROPERTY ON ${schemaName}.property_addresses(property_id);
      CREATE INDEX IF NOT EXISTS IDX_PROPERTY_OWNERS_PROPERTY ON ${schemaName}.property_owners(property_id);
      CREATE INDEX IF NOT EXISTS IDX_PROPERTY_OWNERS_OWNER ON ${schemaName}.property_owners(rental_owner_id);
    `);
  }

  private async seedPropertyTypesAndSubtypes(schemaName: string) {
    // Insertar Property Types
    await this.dataSource.query(`
      INSERT INTO ${schemaName}.property_types (name, code, is_active, created_at, updated_at)
      VALUES
        ('Residencial', 'RESIDENTIAL', true, NOW(), NOW()),
        ('Comercial', 'COMMERCIAL', true, NOW(), NOW())
      ON CONFLICT (code) DO NOTHING;
    `);

    // Obtener los IDs de los tipos insertados
    const types = await this.dataSource.query(`
      SELECT id, code FROM ${schemaName}.property_types WHERE code IN ('RESIDENTIAL', 'COMMERCIAL')
    `);

    const residentialId = types.find((t: any) => t.code === 'RESIDENTIAL').id;
    const commercialId = types.find((t: any) => t.code === 'COMMERCIAL').id;

    // Insertar Property Subtypes para RESIDENTIAL
    await this.dataSource.query(
      `
      INSERT INTO ${schemaName}.property_subtypes (property_type_id, name, code, is_active, created_at, updated_at)
      VALUES
        ($1, 'Condominio/Townhouse', 'CONDO_TOWNHOME', true, NOW(), NOW()),
        ($1, 'Multifamiliar', 'MULTI_FAMILY', true, NOW(), NOW()),
        ($1, 'Unifamiliar', 'SINGLE_FAMILY', true, NOW(), NOW())
      ON CONFLICT (code) DO NOTHING;
    `,
      [residentialId],
    );

    // Insertar Property Subtypes para COMERCIAL
    await this.dataSource.query(
      `
      INSERT INTO ${schemaName}.property_subtypes (property_type_id, name, code, is_active, created_at, updated_at)
      VALUES
        ($1, 'Industrial', 'INDUSTRIAL', true, NOW(), NOW()),
        ($1, 'Oficina', 'OFFICE', true, NOW(), NOW()),
        ($1, 'Alquiler', 'RENTAL', true, NOW(), NOW()),
        ($1, 'Centro Comercial', 'SHOPPING_CENTER', true, NOW(), NOW()),
        ($1, 'Bodega/Depósito', 'STORAGE', true, NOW(), NOW()),
        ($1, 'Estacionamiento', 'PARKING_SPACE', true, NOW(), NOW())
      ON CONFLICT (code) DO NOTHING;
    `,
      [commercialId],
    );
  }

  private async dropTenantSchema(tenant: Tenant) {
    try {
      // Eliminar el schema de PostgreSQL (CASCADE elimina todas las tablas)
      await this.dataSource.query(
        `DROP SCHEMA IF EXISTS ${tenant.schema_name} CASCADE`,
      );
    } catch (error) {
      throw new BadRequestException(`Failed to drop schema: ${error.message}`);
    }
  }
}
