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
          // IMPORTANTE: Extraer el slug de la URL (primer segmento)
          // Usar originalUrl para obtener la URL original completa antes del route matching
          const urlSlug = this.extractSlugFromUrl(req.originalUrl);

          // Verificar que el slug de la URL coincida con el tenantSlug del JWT
          // SIEMPRE que haya un slug en la URL, debe coincidir
          if (urlSlug && urlSlug !== payload.tenantSlug) {
            throw new UnauthorizedException(
              `Tenant slug "${urlSlug}" does not match your authentication token (${payload.tenantSlug})`,
            );
          }

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
        // Si es UnauthorizedException, lanzarla
        if (error instanceof UnauthorizedException) {
          throw error;
        }
        // Continuar sin lanzar error, podría ser un endpoint público
      }
    }

    // Estrategia 2: Extraer tenant del slug en la URL (para endpoints públicos)
    const slug = this.extractSlugFromUrl(req.originalUrl);

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

  /**
   * Extrae el slug de la URL (primer segmento)
   * Retorna null si el primer segmento es una palabra reservada
   */
  private extractSlugFromUrl(path: string): string | null {
    const urlParts = path.split('/').filter(Boolean);

    if (urlParts.length === 0) {
      return null;
    }

    const firstSegment = urlParts[0];

    // Palabras reservadas que NO son slugs de tenant
    const reservedWords = [
      'api',
      'health',
      'docs',
      'auth',
      'catalog',
      'login',
      'register',
    ];

    if (reservedWords.includes(firstSegment)) {
      return null;
    }

    return firstSegment;
  }
}
