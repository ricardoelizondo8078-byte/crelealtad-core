import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';
import { SolicitudEntity } from './solicitud.entity';

type CreateSolicitudDto = {
  solicitanteId: string;
  [key: string]: string | boolean | number | undefined;
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
    return this.solicitudesService.createOrUpdateForSolicitante(dto);
  }

  @Put('solicitante/:solicitanteId')
  update(@Param('solicitanteId') solicitanteId: string, @Body() dto: CreateSolicitudDto) {
    return this.solicitudesService.createOrUpdateForSolicitante({ ...dto, solicitanteId });
  }

  @Patch(':solicitanteId')
  async partialUpdate(
    @Param('solicitanteId') solicitanteId: string,
    @Body() data: Partial<SolicitudEntity>,
  ) {
    return this.solicitudesService.partialUpdate(solicitanteId, data);
  }
}
