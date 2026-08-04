import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ExpedientesModule } from './expedientes/expedientes.module';
import { GruposModule } from './grupos/grupos.module';
import { HealthController } from './health.controller';
import { IntegrantesModule } from './integrantes/integrantes.module';
import { SolicitudesModule } from './solicitudes/solicitudes.module';
import { CodigosPostalesModule } from './codigos-postales/codigos-postales.module';

@Module({
  controllers: [HealthController],
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: process.env.DB_PASSWORD || process.env.DB_PASS,
      database: 'crelealtad',
      ssl: false,
      synchronize: false, // ⚠️ DESACTIVADO - Schema se gestiona con migraciones SQL
      autoLoadEntities: true,
      logging: true,
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
