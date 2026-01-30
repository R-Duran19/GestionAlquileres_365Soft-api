import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TenantsService } from '../tenants/tenants.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { generateSlug } from '../common/utils/slug-generator';

interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private tenantsService: TenantsService,
    private jwtService: JwtService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async validateUser(email: string, password: string, tenantSlug: string) {
    // Obtener el tenant primero para setear el schema correcto
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    // Setear el schema para esta query
    await this.dataSource.query(`SET search_path TO ${tenant.schema_name}`);

    const user = await this.findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('User is inactive');
    }

    return user;
  }

  async login(user: any, tenantSlug: string) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      tenantSlug: tenantSlug,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(
    name: string,
    email: string,
    password: string,
    tenantSlug: string,
    phone?: string,
  ) {
    // Obtener el tenant primero para setear el schema correcto
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    // Setear el schema para esta query
    await this.dataSource.query(`SET search_path TO ${tenant.schema_name}`);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.createUser({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'INQUILINO',
      is_active: true,
    });

    // Retornar sin el password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async registerAdmin(data: {
    slug?: string;
    company_name: string;
    name: string;
    email: string;
    password: string;
    currency?: string;
    locale?: string;
    phone?: string;
  }) {
    const {
      slug: providedSlug,
      company_name,
      name,
      email,
      password,
      currency = 'BOB',
      locale = 'es-BO',
      phone,
    } = data;

    // 1. Generar o usar el slug proporcionado
    const slug = providedSlug || generateSlug(company_name);

    // 2. Verificar si ya existe un tenant con ese slug
    try {
      await this.tenantsService.findBySlug(slug);
      // Si no lanza error, ya existe, así que lanzamos excepción
      throw new BadRequestException(
        `Tenant with slug '${slug}' already exists. Please use a different company name or slug.`,
      );
    } catch (error) {
      // Si es NotFoundException, perfecto, no existe
      if (error.status !== 404) {
        throw error; // Si es otro error, relanzarlo
      }
    }

    // 3. Crear el tenant (esto también crea el schema y todas las tablas)
    const tenant = await this.tenantsService.create({
      slug,
      company_name,
      currency,
      locale,
      is_active: true,
    });

    // 4. Cambiar al schema del nuevo tenant
    await this.dataSource.query(`SET search_path TO ${tenant.schema_name}`);

    // 5. Crear el usuario admin
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.createUser({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'ADMIN',
      is_active: true,
    });

    // 6. Generar token JWT
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      tenantSlug: tenant.slug,
    };

    const access_token = this.jwtService.sign(payload);

    // 7. Retornar todo junto
    const { password: _, ...userWithoutPassword } = user;

    return {
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        company_name: tenant.company_name,
        currency: tenant.currency,
        locale: tenant.locale,
      },
      user: userWithoutPassword,
      access_token,
    };
  }

  // Métodos privados para manejar usuarios con queries SQL
  private async findUserByEmail(email: string): Promise<User | null> {
    const result = await this.dataSource.query(
      'SELECT * FROM "user" WHERE email = $1',
      [email],
    );
    return result.length > 0 ? result[0] : null;
  }

  private async createUser(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: string;
    is_active: boolean;
  }): Promise<User> {
    const { name, email, password, phone, role, is_active } = data;

    const result = await this.dataSource.query(
      `INSERT INTO "user" (email, password, name, phone, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [email, password, name, phone || null, role, is_active],
    );

    return result[0];
  }
}
