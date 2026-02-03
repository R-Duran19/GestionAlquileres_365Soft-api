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
          // IMPORTANTE: Consultar en schema public porque la tabla tenant está ahí
          const tenant = await this.dataSource.query(
            'SELECT * FROM public.tenant WHERE slug = $1',
            [payload.tenantSlug],
          );

          if (!tenant || tenant.length === 0) {
            throw new NotFoundException('Tenant not found');
          }

          // Setear search_path al schema del tenant
          await this.dataSource.query(
            `SET search_path TO ${tenant[0].schema_name}`,
          );

          req.tenant = tenant[0];
          return next();
        }
      } catch (error) {
        // Continuar sin lanzar error, podría ser un endpoint público
      }
    }

    // Estrategia 2: Extraer tenant del slug en la URL (para endpoints públicos)
    const slug = this.extractSlugFromRequest(req);

    if (slug) {
      // IMPORTANTE: Consultar en schema public porque la tabla tenant está ahí
      const tenant = await this.dataSource.query(
        'SELECT * FROM public.tenant WHERE slug = $1',
        [slug],
      );

      if (!tenant || tenant.length === 0) {
        throw new NotFoundException('Tenant not found');
      }

      await this.dataSource.query(
        `SET search_path TO ${tenant[0].schema_name}`,
      );

      req.tenant = tenant[0];
      return next();
    }

    // Si no hay tenant y no es un endpoint público sin tenant, lanzar error
    // Por ahora, permitimos pasar para endpoints públicos que no requieren tenant
    next();
  }

  private extractSlugFromRequest(req: TenantRequest): string | null {
    // Estrategias para extraer el slug de la URL
    // Patrones soportados:
    // 1. /:slug/catalog/properties (catalog con slug al inicio)
    // 2. /:slug/auth/login (auth con slug al inicio)
    // 3. /:slug/tenant/* (rutas de inquilinos)
    // 4. /:slug/admin/* (rutas de admin)
    // 5. /auth/:slug/login (auth con slug después - LEGACY, mantener por compatibilidad)
    // 6. /catalog/:slug/properties (catalog con slug después - LEGACY, mantener por compatibilidad)

    const urlParts = req.path.split('/').filter(Boolean);

    // Nuevo patrón: slug al inicio de la URL
    // /:slug/... donde slug es el primer segmento
    if (urlParts.length >= 2) {
      const firstSegment = urlParts[0];

      // El primer segmento es el slug si el segundo es un segmento conocido
      const knownSegments = ['catalog', 'auth', 'tenant', 'admin'];

      if (knownSegments.includes(urlParts[1])) {
        // Verificar que el primer segmento no sea una palabra reservada
        const reservedWords = ['api', 'health', 'docs', 'auth', 'catalog', 'tenant', 'admin', 'login', 'register'];
        if (!reservedWords.includes(firstSegment)) {
          return firstSegment;
        }
      }
    }

    // Patrones LEGACY: mantener compatibilidad con rutas antiguas
    // /catalog/:slug/... o /auth/:slug/...
    if (urlParts.length >= 2) {
      if (urlParts[0] === 'catalog' || urlParts[0] === 'auth') {
        return urlParts[1]; // El slug está después de 'catalog' o 'auth'
      }
    }

    return null;
  }
}
