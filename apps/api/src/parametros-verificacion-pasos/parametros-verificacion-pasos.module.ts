import { Module } from '@nestjs/common';
import { IntegrantesModule } from '../integrantes/integrantes.module';
import { SolicitudesModule } from '../solicitudes/solicitudes.module';
import {
  ParametrosVerificacionPasosController,
  PasosVerificacionController,
} from './parametros-verificacion-pasos.controller';
import { ParametrosVerificacionPasosService } from './parametros-verificacion-pasos.service';

@Module({
  imports: [IntegrantesModule, SolicitudesModule],
  controllers: [ParametrosVerificacionPasosController, PasosVerificacionController],
  providers: [ParametrosVerificacionPasosService],
  exports: [ParametrosVerificacionPasosService],
})
export class ParametrosVerificacionPasosModule {}
