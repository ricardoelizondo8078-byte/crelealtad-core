import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicitudEntity } from './solicitud.entity';
import { SolicitudReadEntity } from './entities/solicitud-read.entity';
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
import { IntegrantesModule } from '../integrantes/integrantes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SolicitudEntity,
      SolicitudReadEntity,
      SolicitudCoreEntity,
      SolicitudDatosPersonalesEntity,
      SolicitudDomiciliosEntity,
      SolicitudNegociosEntity,
      SolicitudReferenciasEntity,
      SolicitudBeneficiariosEntity,
      SolicitudValidacionesEntity,
      SolicitudDocumentosEntity,
    ]),
    forwardRef(() => IntegrantesModule),
  ],
  controllers: [SolicitudesController],
  providers: [SolicitudesService],
  exports: [SolicitudesService],
})
export class SolicitudesModule {}
