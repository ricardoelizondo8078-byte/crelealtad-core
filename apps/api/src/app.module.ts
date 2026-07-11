import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentosModule } from './documentos/documentos.module';
import { ExpedientesModule } from './expedientes/expedientes.module';
import { GruposModule } from './grupos/grupos.module';
import { HealthController } from './health.controller';
import { SolicitantesModule } from './solicitantes/solicitantes.module';
import { SolicitudesModule } from './solicitudes/solicitudes.module';

@Module({
  controllers: [HealthController],
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'db.cjpvpxnnjpnbkmemdpqy.supabase.co',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'postgres',
      ssl: { rejectUnauthorized: false },
      synchronize: true,
      autoLoadEntities: true,
      logging: true,
      retryAttempts: 3,
      retryDelay: 3000,
      extra: {
        max: 10,
        connectionTimeoutMillis: 5000,
      },
    }),
    GruposModule,
    ExpedientesModule,
    SolicitantesModule,
    SolicitudesModule,
    DocumentosModule,
  ],
})
export class AppModule {}
