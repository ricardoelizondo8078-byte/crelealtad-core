import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SolicitantesService } from './solicitantes.service';

class CreateSolicitanteDto {
  expedienteId: string;
  nombre: string;
  telefono: string;
  montoSolicitado: number;
}

@Controller('solicitantes')
export class SolicitantesController {
  constructor(private readonly solicitantesService: SolicitantesService) {}

  @Get('expediente/:expedienteId')
  listByExpediente(@Param('expedienteId') expedienteId: string) {
    return this.solicitantesService.listByExpediente(expedienteId);
  }

  @Post()
  create(@Body() dto: CreateSolicitanteDto) {
    return this.solicitantesService.createForExpediente(dto);
  }
}
