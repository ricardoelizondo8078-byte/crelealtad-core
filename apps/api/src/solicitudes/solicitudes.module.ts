import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicitudCoreEntity } from './entities/solicitud-core.entity';
import { SolicitudDatosPersonalesEntity } from './entities/solicitud-datos-personales.entity';
import { SolicitudDomiciliosEntity } from './entities/solicitud-domicilios.entity';
import { SolicitudNegociosEntity } from './entities/solicitud-negocios.entity';
import { SolicitudReferenciasEntity } from './entities/solicitud-referencias.entity';
import { SolicitudBeneficiariosEntity } from './entities/solicitud-beneficiarios.entity';
import { SolicitudValidacionesEntity } from './entities/solicitud-validaciones.entity';
import { SolicitudDocumentosEntity } from './entities/solicitud-documentos.entity';
import { SolicitudesController } from './solicitudes.controller';
import { SolicitudesService } from './solicitudes.service';
import { DocumentosStorageService } from './documentos/documentos-storage.service';
import { IntegranteEntity } from '../integrantes/integrante.entity';
import { DocumentosStoragePort } from './documentos/documentos-storage.port';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SolicitudCoreEntity,
      SolicitudDatosPersonalesEntity,
      SolicitudDomiciliosEntity,
      SolicitudNegociosEntity,
      SolicitudReferenciasEntity,
      SolicitudBeneficiariosEntity,
      SolicitudValidacionesEntity,
      SolicitudDocumentosEntity,
      IntegranteEntity,
    ]),
  ],
  controllers: [SolicitudesController],
  providers: [
    SolicitudesService,
    DocumentosStorageService,
    { provide: DocumentosStoragePort, useExisting: DocumentosStorageService },
  ],
  exports: [SolicitudesService, DocumentosStoragePort],
})
export class SolicitudesModule {}
