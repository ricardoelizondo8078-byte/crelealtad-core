import { Body, Controller, Get, Param, Post, Patch } from '@nestjs/common';
import { SolicitantesService } from './solicitantes.service';
import { SolicitanteEstado } from './solicitante.entity';

class CreateSolicitanteDto {
  expedienteId: string;
  nombre: string; // Nombre completo (retrocompatibilidad)
  nombres?: string; // Nombre(s) separado
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  telefono: string;
  telefonoSecundario?: string;
  montoSolicitado: number;
}

class UpdateEstadoDto {
  estado: SolicitanteEstado.EN_VERIFICACION | SolicitanteEstado.AUTORIZADA | SolicitanteEstado.RECHAZADA;
}

@Controller('solicitantes')
export class SolicitantesController {
  constructor(private readonly solicitantesService: SolicitantesService) {}

  @Get('expediente/:expedienteId')
  listByExpediente(@Param('expedienteId') expedienteId: string) {
    return this.solicitantesService.listByExpediente(expedienteId);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.solicitantesService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateSolicitanteDto) {
    return this.solicitantesService.createForExpediente(dto);
  }

  @Patch(':id/estado')
  updateEstado(@Param('id') id: string, @Body() dto: UpdateEstadoDto) {
    return this.solicitantesService.updateEstadoManual(id, dto.estado);
  }
}
