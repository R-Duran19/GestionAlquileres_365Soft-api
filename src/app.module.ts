import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from './common/config';
import { HealthModule } from './common/health/health.module';
import { TenantsModule } from './tenants/tenants.module';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PropertiesModule } from './properties/properties.module';
import { ContractsModule } from './contracts/contracts.module';

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
        // IMPORTANTE: Cargar todas las entidades pero solo sincronizar las del schema public
        // Las entidades de tenants (properties, users, etc.) se crean manualmente en cada schema
        // Registramos todas las entidades para que TypeORM conozca su estructura,
        // pero NO sincronizamos (synchronize: false) para que no se creen en el esquema 'public'.
        entities: [
          __dirname + '/tenants/metadata/*.entity{.ts,.js}',
          __dirname + '/properties/entities/*.entity{.ts,.js}',
          __dirname + '/users/*.entity{.ts,.js}',
          __dirname + '/contracts/entities/*.entity{.ts,.js}',
        ],
        synchronize: false,
        logging: configService.app.nodeEnv === 'development',
      }),
    }),
    TenantsModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    ContractsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantContextMiddleware)
      .exclude(
        // Rutas de health check y endpoints públicos sin tenant
        { path: 'health', method: RequestMethod.GET },
        { path: 'auth/register-admin', method: RequestMethod.POST }, // Crear tenant + admin no requiere tenant context
        // NOTA: auth/:slug/login y auth/:slug/register NO se excluyen porque necesitan detectar el tenant
      )
      .forRoutes('*');
  }
}
