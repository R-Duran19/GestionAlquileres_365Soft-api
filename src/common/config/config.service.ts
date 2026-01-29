import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { DatabaseConfig, AppConfig, JwtConfig } from './database.config';

@Injectable()
export class ConfigService {
  constructor(private nestConfigService: NestConfigService) {}

  get database(): DatabaseConfig {
    return {
      host: this.nestConfigService.get<string>('DB_HOST') || 'localhost',
      port: this.nestConfigService.get<number>('DB_PORT') || 5432,
      username: this.nestConfigService.get<string>('DB_USERNAME') || '',
      password: this.nestConfigService.get<string>('DB_PASSWORD') || '',
      database: this.nestConfigService.get<string>('DB_DATABASE') || '',
    };
  }

  get app(): AppConfig {
    return {
      port: this.nestConfigService.get<number>('PORT') || 3000,
      nodeEnv: this.nestConfigService.get<string>('NODE_ENV') || 'development',
    };
  }

  get jwt(): JwtConfig {
    return {
      secret: this.nestConfigService.get<string>('JWT_SECRET') || '',
      expiration: this.nestConfigService.get<string>('JWT_EXPIRATION') || '7d',
    };
  }
}
