import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TenantsModule } from '../tenants/tenants.module';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TenantsModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'your-secret-key-change-in-production',
        signOptions: {
          expiresIn: '7d',
        },
      }),
      global: true, // Hacer JwtModule disponible globalmente
    }),
    TypeOrmModule.forFeature([]),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
