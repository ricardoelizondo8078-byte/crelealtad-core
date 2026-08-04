import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';
import { SolicitudEntity } from './solicitud.entity';

type CreateSolicitudDto = {
  solicitanteId?: string;  // Legacy
  integrante_id?: string;  // Schema v2 (campo correcto)
  [key: string]: string | boolean | number | undefined;
};

@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @Get('solicitante/:solicitanteId')
  getBySolicitante(@Param('solicitanteId') solicitanteId: string) {
    return this.solicitudesService.getBySolicitante(solicitanteId);
  }

  @Get('integrante/:integranteId')
  getByIntegrante(@Param('integranteId') integranteId: string) {
    return this.solicitudesService.getBySolicitante(integranteId);
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

  @Patch('integrante/:integranteId')
  async partialUpdateByIntegrante(
    @Param('integranteId') integranteId: string,
    @Body() data: Partial<SolicitudEntity>,
  ) {
    return this.solicitudesService.partialUpdate(integranteId, data);
  }
}
