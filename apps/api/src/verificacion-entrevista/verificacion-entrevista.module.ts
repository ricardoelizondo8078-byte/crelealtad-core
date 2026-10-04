import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegranteEntity } from '../integrantes/integrante.entity';
import { EntrevistaEvidenciaStorageService } from './entrevista-evidencia-storage.service';
import { VerificacionEntrevistaDesacuerdoMontoEntity } from './verificacion-entrevista-desacuerdo-monto.entity';
import { VerificacionEntrevistaEvidenciaEntity } from './verificacion-entrevista-evidencia.entity';
import { VerificacionEntrevistaFamiliarEntity } from './verificacion-entrevista-familiar.entity';
import { VerificacionEntrevistaEntity } from './verificacion-entrevista.entity';
import { VerificacionEntrevistaController } from './verificacion-entrevista.controller';
import { VerificacionEntrevistaService } from './verificacion-entrevista.service';

@Module({
  imports: [TypeOrmModule.forFeature([
    VerificacionEntrevistaEntity,
    VerificacionEntrevistaFamiliarEntity,
    VerificacionEntrevistaDesacuerdoMontoEntity,
    VerificacionEntrevistaEvidenciaEntity,
    IntegranteEntity,
  ])],
  controllers: [VerificacionEntrevistaController],
  providers: [VerificacionEntrevistaService, EntrevistaEvidenciaStorageService],
})
export class VerificacionEntrevistaModule {}
