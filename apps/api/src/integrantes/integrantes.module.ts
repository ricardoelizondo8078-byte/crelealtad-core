import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegranteEntity } from './integrante.entity';
import { IntegrantesController } from './integrantes.controller';
import { IntegrantesService } from './integrantes.service';
import { PersonaEntity } from '../personas/persona.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IntegranteEntity, PersonaEntity])],
  controllers: [IntegrantesController],
  providers: [IntegrantesService],
  exports: [IntegrantesService],
})
export class IntegrantesModule {}
