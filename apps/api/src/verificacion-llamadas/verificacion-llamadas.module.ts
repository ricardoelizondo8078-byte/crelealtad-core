import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegranteEntity } from '../integrantes/integrante.entity';
import { LlamadaEvidenciaStorageService } from './llamada-evidencia-storage.service';
import { VerificacionLlamadaCaracteristicaEntity } from './verificacion-llamada-caracteristica.entity';
import { VerificacionLlamadaEncuestaEntity } from './verificacion-llamada-encuesta.entity';
import { VerificacionLlamadaEvidenciaEntity } from './verificacion-llamada-evidencia.entity';
import { VerificacionLlamadaEntity } from './verificacion-llamada.entity';
import { VerificacionEntrevistaTelefonoConfirmacionEntity } from './verificacion-entrevista-telefono-confirmacion.entity';
import { VerificacionLlamadasController } from './verificacion-llamadas.controller';
import { VerificacionLlamadasService } from './verificacion-llamadas.service';

@Module({
  imports: [TypeOrmModule.forFeature([
    VerificacionLlamadaEntity,
    VerificacionLlamadaEncuestaEntity,
    VerificacionLlamadaCaracteristicaEntity,
    VerificacionLlamadaEvidenciaEntity,
    VerificacionEntrevistaTelefonoConfirmacionEntity,
    IntegranteEntity,
  ])],
  controllers: [VerificacionLlamadasController],
  providers: [VerificacionLlamadasService, LlamadaEvidenciaStorageService],
})
export class VerificacionLlamadasModule {}
