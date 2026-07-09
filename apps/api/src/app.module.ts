import { Module } from '@nestjs/common';
import { DocumentosModule } from './documentos/documentos.module';
import { ExpedientesModule } from './expedientes/expedientes.module';
import { GruposModule } from './grupos/grupos.module';
import { HealthController } from './health.controller';
import { SolicitantesModule } from './solicitantes/solicitantes.module';
import { SolicitudesModule } from './solicitudes/solicitudes.module';

@Module({
  controllers: [HealthController],
  imports: [GruposModule, ExpedientesModule, SolicitantesModule, SolicitudesModule, DocumentosModule],
})
export class AppModule {}
