import { Module } from '@nestjs/common';
import {
  MotivosClasificacionEvidenciaVerificacionController,
  ParametrosEvidenciaMotivosController,
} from './parametros-evidencia-motivos.controller';
import { ParametrosEvidenciaMotivosService } from './parametros-evidencia-motivos.service';

@Module({
  controllers: [
    ParametrosEvidenciaMotivosController,
    MotivosClasificacionEvidenciaVerificacionController,
  ],
  providers: [ParametrosEvidenciaMotivosService],
  exports: [ParametrosEvidenciaMotivosService],
})
export class ParametrosEvidenciaMotivosModule {}
