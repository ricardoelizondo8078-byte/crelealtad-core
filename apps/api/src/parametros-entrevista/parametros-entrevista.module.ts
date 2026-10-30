import { Module } from '@nestjs/common';
import { ParametrosEntrevistaController, ParametrosEntrevistaVerificacionController } from './parametros-entrevista.controller';
import { ParametrosEntrevistaService } from './parametros-entrevista.service';

@Module({
  controllers: [ParametrosEntrevistaController, ParametrosEntrevistaVerificacionController],
  providers: [ParametrosEntrevistaService],
  exports: [ParametrosEntrevistaService],
})
export class ParametrosEntrevistaModule {}
