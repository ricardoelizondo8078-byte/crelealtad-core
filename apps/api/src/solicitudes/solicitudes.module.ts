import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicitudEntity } from './solicitud.entity';
import { SolicitudesController } from './solicitudes.controller';
import { SolicitudesService } from './solicitudes.service';
import { IntegrantesModule } from '../integrantes/integrantes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SolicitudEntity]),
    forwardRef(() => IntegrantesModule),
  ],
  controllers: [SolicitudesController],
  providers: [SolicitudesService],
  exports: [SolicitudesService],
})
export class SolicitudesModule {}
