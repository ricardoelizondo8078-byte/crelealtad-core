import { Module } from '@nestjs/common';
import {
  FinancierasCompetidorasVerificacionController,
  ParametrosFinancierasController,
} from './parametros-financieras.controller';
import { ParametrosFinancierasService } from './parametros-financieras.service';

@Module({
  controllers: [
    ParametrosFinancierasController,
    FinancierasCompetidorasVerificacionController,
  ],
  providers: [ParametrosFinancierasService],
})
export class ParametrosFinancierasModule {}
