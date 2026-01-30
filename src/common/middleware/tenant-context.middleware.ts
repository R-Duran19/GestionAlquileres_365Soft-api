import { Injectable, NestMiddleware, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
          secret: this.configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
        });

        if (payload.tenantSlug) {
          // IMPORTANTE: Consultar en schema public porque la tabla tenant está ahí
          const tenant = await this.dataSource.query(
            'SELECT * FROM public.tenant WHERE slug = $1',
            [payload.tenantSlug]
          );

          if (!tenant || tenant.length === 0) {
            throw new NotFoundException('Tenant not found');
          }

          // Setear search_path al schema del tenant
          await this.dataSource.query(`SET search_path TO ${tenant[0].schema_name}`);

          req.tenant = tenant[0];
          return next();
        }
      } catch (error) {
        // Continuar sin lanzar error, podría ser un endpoint público
      }
    }

    // Estrategia 2: Extraer tenant del slug en la URL (para endpoints públicos)
    // Buscar slug en diferentes partes de la URL
    const slug = this.extractSlugFromRequest(req);

    if (slug) {
      // IMPORTANTE: Consultar en schema public porque la tabla tenant está ahí
      const tenant = await this.dataSource.query(
        'SELECT * FROM public.tenant WHERE slug = $1',
        [slug]
      );

      if (!tenant || tenant.length === 0) {
        throw new NotFoundException('Tenant not found');
      }

      await this.dataSource.query(`SET search_path TO ${tenant[0].schema_name}`);

      req.tenant = tenant[0];
      return next();
    }

    // Si no hay tenant y no es un endpoint público sin tenant, lanzar error
    // Por ahora, permitimos pasar para endpoints públicos que no requieren tenant
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
