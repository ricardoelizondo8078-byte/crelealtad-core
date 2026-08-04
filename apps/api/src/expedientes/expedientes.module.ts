import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpedienteEntity } from './expediente.entity';
import { ExpedientesController } from './expedientes.controller';
import { ExpedientesService } from './expedientes.service';
import { IntegranteEntity } from '../integrantes/integrante.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExpedienteEntity, IntegranteEntity])],
  controllers: [ExpedientesController],
  providers: [ExpedientesService],
  exports: [ExpedientesService],
})
export class ExpedientesModule {}
