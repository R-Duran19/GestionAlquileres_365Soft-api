import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface TenantRequest extends Request {
  tenant?: {
    id: number;
    slug: string;
    schema_name: string;
    company_name: string;
    currency: string;
    locale: string;
  };
  user?: {
    userId: number;
    email: string;
    role: string;
    tenantSlug?: string;
  };
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async use(req: TenantRequest, res: Response, next: NextFunction) {
    // 1. Siempre resetear al esquema public al inicio de cada petición
    // Esto evita que una petición use el esquema de la petición anterior en el pool de conexiones
    await this.dataSource.query('SET search_path TO public');

    let slug: string | null = null;

    // Estrategia 1: Extraer tenant del JWT (para endpoints privados)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payload = this.jwtService.verify(token, {
          secret:
            this.configService.get<string>('JWT_SECRET') ||
            'your-secret-key-change-in-production',
        });

        if (payload.tenantSlug) {
          slug = payload.tenantSlug;
          req.user = {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
            tenantSlug: payload.tenantSlug,
          };
        }
      } catch (error) {
        // Token inválido, ignorar y seguir (puede ser un endpoint público)
      }
    }

    // Estrategia 2: Extraer tenant del slug en la URL (para endpoints públicos o verificaciones cruzadas)
    const urlSlug = this.extractSlugFromRequest(req);

    // Verificación Cruzada: Si hay JWT, el slug del JWT debe coincidir con el de la URL (si existe en la URL)
    if (slug && urlSlug && slug !== urlSlug) {
      throw new UnauthorizedException(
        'User does not belong to the requested organization',
      );
    }

    // Si no hay slug del JWT, usamos el de la URL
    if (!slug) {
      slug = urlSlug;
    }

    if (slug) {
      // IMPORTANTE: Consultar en schema public porque la tabla tenant está ahí
      const [tenant] = await this.dataSource.query(
        'SELECT id, slug, schema_name, company_name, currency, locale FROM public.tenant WHERE slug = $1',
        [slug],
      );

      if (!tenant) {
        throw new NotFoundException(`Empresa '${slug}' no encontrada`);
      }

      // 2da VERIFICACIÓN: Cambiar al esquema del tenant. 
      // Esto asegura que cualquier query posterior solo vea los datos de ESTE tenant.
      await this.dataSource.query(
        `SET search_path TO ${tenant.schema_name}, public`,
      );

      // Si hay un usuario logueado, verificamos que EXISTA en este esquema específico
      // Esta es la segunda verificación que pedía el usuario
      if (req.user) {
        const [userExists] = await this.dataSource.query(
          'SELECT id FROM "user" WHERE id = $1',
          [req.user.userId],
        );

        if (!userExists) {
          // Si el ID de usuario no existe en este esquema, el token no es válido para este tenant
          throw new UnauthorizedException('User not authorized for this company');
        }
      }

      req.tenant = tenant;
    }

    next();
  }

  private extractSlugFromRequest(req: TenantRequest): string | null {
    // Estrategias para extraer el slug de la URL
    // 1. /catalog/:slug/properties
    // 2. /auth/:slug/login
    // 3. /auth/:slug/register

    const urlParts = req.path.split('/').filter(Boolean);

    // Buscar 'catalog' o 'auth' en la URL
    if (urlParts.length >= 2) {
      if (urlParts[0] === 'catalog' || urlParts[0] === 'auth') {
        return urlParts[1]; // El slug está después de 'catalog' o 'auth'
      }
    }

    return null;
  }
}
