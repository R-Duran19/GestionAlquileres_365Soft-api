import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from './common/config';
import { HealthModule } from './common/health/health.module';
import { TenantsModule } from './tenants/tenants.module';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';

@Module({
  imports: [
    ConfigModule,
    HealthModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.database.host,
        port: configService.database.port,
        username: configService.database.username,
        password: configService.database.password,
        database: configService.database.database,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.app.nodeEnv === 'development', // Solo en desarrollo
        logging: configService.app.nodeEnv === 'development',
      }),
    }),
    TenantsModule,
  ],
  controllers: [AppController],
  providers: [AppService, TenantContextMiddleware],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantContextMiddleware)
      .exclude(
        // Rutas de health check y endpoints públicos sin tenant
        { path: 'health', method: RequestMethod.GET },
        { path: 'tenants', method: RequestMethod.POST }, // Crear tenant no requiere tenant
      )
      .forRoutes('*');
  }
}
