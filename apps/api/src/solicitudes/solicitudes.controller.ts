import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';

type CreateSolicitudDto = {
  solicitanteId: string;
  [key: string]: string | boolean | undefined;
};

@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @Get('solicitante/:solicitanteId')
  getBySolicitante(@Param('solicitanteId') solicitanteId: string) {
    return this.solicitudesService.getBySolicitante(solicitanteId);
  }

  @Post()
  create(@Body() dto: CreateSolicitudDto) {
    return this.solicitudesService.createForSolicitante(dto);
  }
}
