import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicitanteEntity } from './solicitante.entity';
import { SolicitantesController } from './solicitantes.controller';
import { SolicitantesService } from './solicitantes.service';

@Module({
  imports: [TypeOrmModule.forFeature([SolicitanteEntity])],
  controllers: [SolicitantesController],
  providers: [SolicitantesService],
  exports: [SolicitantesService],
})
export class SolicitantesModule {}
