import { Body, Controller, Get, Param, Post, Patch } from '@nestjs/common';
import { IntegrantesService } from './integrantes.service';
import { IntegranteEstado } from './integrante.entity';

class CreateIntegranteDto {
  expedienteId?: string;
  expediente_id?: string;
  nombre?: string;
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  telefono?: string;
  montoSolicitado?: number;
  persona_id?: string;
}

class UpdateEstadoDto {
  estado: IntegranteEstado.EN_VERIFICACION | IntegranteEstado.AUTORIZADA | IntegranteEstado.RECHAZADA | IntegranteEstado.SUJETA_CREDITO;
}

class UpdateIntegranteDto {
  persona_id?: string;
  // Campos de persona que se pueden actualizar
  nombres?: string;
  apellido_pat?: string;
  apellido_mat?: string;
  nombre?: string;
  telefono?: string;
  telefonoSecundario?: string;
  telefono_secundario?: string;
  montoSolicitado?: number;
}

@Controller('integrantes')
export class IntegrantesController {
  constructor(private readonly integrantesService: IntegrantesService) {}

  @Get('expediente/:expedienteId')
  listByExpediente(@Param('expedienteId') expedienteId: string) {
    return this.integrantesService.listByExpediente(expedienteId);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.integrantesService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateIntegranteDto) {
    return this.integrantesService.createForExpediente(dto);
  }

  @Patch(':id/estado')
  updateEstado(@Param('id') id: string, @Body() dto: UpdateEstadoDto) {
    return this.integrantesService.updateEstadoManual(id, dto.estado);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateIntegranteDto) {
    return this.integrantesService.update(id, dto);
  }
}
