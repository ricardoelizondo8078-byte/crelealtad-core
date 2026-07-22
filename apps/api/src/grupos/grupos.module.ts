import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpedientesModule } from '../expedientes/expedientes.module';
import { GrupoEntity } from './grupo.entity';
import { GruposController } from './grupos.controller';
import { GruposService } from './grupos.service';
import { ExpedienteEntity } from '../expedientes/expediente.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GrupoEntity, ExpedienteEntity]),
    ExpedientesModule,
  ],
  controllers: [GruposController],
  providers: [GruposService],
  exports: [GruposService],
})
export class GruposModule {}
