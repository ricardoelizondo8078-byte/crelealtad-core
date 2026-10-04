import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
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
import { LoggingMiddleware } from './common/logging.middleware';
import { PermissionsGuard } from './auth/permissions.guard';
import { RenovacionesModule } from './renovaciones/renovaciones.module';
import { PendientesModule } from './pendientes/pendientes.module';
import { VerificacionLlamadasModule } from './verificacion-llamadas/verificacion-llamadas.module';
import { VerificacionVisitasVecinoModule } from './verificacion-visitas-vecino/verificacion-visitas-vecino.module';
import { VerificacionImagenesDomicilioModule } from './verificacion-imagenes-domicilio/verificacion-imagenes-domicilio.module';
import { VerificacionEntrevistaModule } from './verificacion-entrevista/verificacion-entrevista.module';
import { getDatabaseConfig } from './database.config';

@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
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
    TypeOrmModule.forRoot(getDatabaseConfig()),
    AuthModule,
    GruposModule,
    ExpedientesModule,
    IntegrantesModule,
    SolicitudesModule,
    CodigosPostalesModule,
    RenovacionesModule,
    PendientesModule,
    VerificacionLlamadasModule,
    VerificacionVisitasVecinoModule,
    VerificacionImagenesDomicilioModule,
    VerificacionEntrevistaModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
