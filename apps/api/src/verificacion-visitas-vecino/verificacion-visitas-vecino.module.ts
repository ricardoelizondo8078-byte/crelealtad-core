import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegranteEntity } from '../integrantes/integrante.entity';
import { VerificacionVisitaVecinoEntity } from './verificacion-visita-vecino.entity';
import { VerificacionVisitaVecinoFachadaEntity } from './verificacion-visita-vecino-fachada.entity';
import { VerificacionVisitaVecinoEvidenciaEntity } from './verificacion-visita-vecino-evidencia.entity';
import { VerificacionVisitasVecinoController } from './verificacion-visitas-vecino.controller';
import { VerificacionVisitasVecinoService } from './verificacion-visitas-vecino.service';
import { VisitaVecinoFachadaStorageService } from './visita-vecino-fachada-storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([
    VerificacionVisitaVecinoEntity,
    VerificacionVisitaVecinoFachadaEntity,
    VerificacionVisitaVecinoEvidenciaEntity,
    IntegranteEntity,
  ])],
  controllers: [VerificacionVisitasVecinoController],
  providers: [VerificacionVisitasVecinoService, VisitaVecinoFachadaStorageService],
})
export class VerificacionVisitasVecinoModule {}
