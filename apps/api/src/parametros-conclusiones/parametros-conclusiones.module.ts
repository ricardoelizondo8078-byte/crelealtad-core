import { Module } from '@nestjs/common';
import {
  ParametrosConclusionesController,
  ParametrosConclusionesVerificacionController,
} from './parametros-conclusiones.controller';
import { ParametrosConclusionesService } from './parametros-conclusiones.service';

@Module({
  controllers: [
    ParametrosConclusionesController,
    ParametrosConclusionesVerificacionController,
  ],
  providers: [ParametrosConclusionesService],
})
export class ParametrosConclusionesModule {}
