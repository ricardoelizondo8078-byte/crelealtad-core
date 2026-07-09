import { Module } from '@nestjs/common';
import { ExpedientesModule } from '../expedientes/expedientes.module';
import { GruposController } from './grupos.controller';
import { GruposService } from './grupos.service';

@Module({
  imports: [ExpedientesModule],
  controllers: [GruposController],
  providers: [GruposService],
})
export class GruposModule {}
