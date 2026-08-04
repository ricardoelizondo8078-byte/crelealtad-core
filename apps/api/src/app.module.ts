import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ExpedientesModule } from './expedientes/expedientes.module';
import { GruposModule } from './grupos/grupos.module';
import { HealthController } from './health.controller';
import { IntegrantesModule } from './integrantes/integrantes.module';
import { SolicitudesModule } from './solicitudes/solicitudes.module';
import { CodigosPostalesModule } from './codigos-postales/codigos-postales.module';
import { LoggerModule } from './common/logger/logger.module';

@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  imports: [
    LoggerModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 segundos
        limit: 100, // 100 requests por minuto (general)
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'crelealtad',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      synchronize: false, // ⚠️ DESACTIVADO - Schema se gestiona con migraciones SQL
      autoLoadEntities: true,
      logging: process.env.NODE_ENV !== 'production',
      retryAttempts: 3,
      retryDelay: 3000,
    }),
    AuthModule,
    GruposModule,
    ExpedientesModule,
    IntegrantesModule,
    SolicitudesModule,
    CodigosPostalesModule,
  ],
})
export class AppModule {}
