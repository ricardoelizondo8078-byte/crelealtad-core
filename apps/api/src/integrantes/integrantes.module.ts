import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegranteEntity } from './integrante.entity';
import { IntegrantesController } from './integrantes.controller';
import { IntegrantesService } from './integrantes.service';
import { PersonaEntity } from '../personas/persona.entity';
import { SolicitudesModule } from '../solicitudes/solicitudes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([IntegranteEntity, PersonaEntity]),
    forwardRef(() => SolicitudesModule),
  ],
  controllers: [IntegrantesController],
  providers: [IntegrantesService],
  exports: [IntegrantesService],
})
export class IntegrantesModule {}
