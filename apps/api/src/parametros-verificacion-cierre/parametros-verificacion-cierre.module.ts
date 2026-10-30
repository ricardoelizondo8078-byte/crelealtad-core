import { Module } from '@nestjs/common';
import {
  ParametrosVerificacionCierreController,
  ParametrosVerificacionCierreOperativoController,
} from './parametros-verificacion-cierre.controller';
import { ParametrosVerificacionCierreService } from './parametros-verificacion-cierre.service';

@Module({
  controllers: [
    ParametrosVerificacionCierreController,
    ParametrosVerificacionCierreOperativoController,
  ],
  providers: [ParametrosVerificacionCierreService],
  exports: [ParametrosVerificacionCierreService],
})
export class ParametrosVerificacionCierreModule {}
