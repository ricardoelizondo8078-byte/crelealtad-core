import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';
import { SolicitudEntity } from './solicitud.entity';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';

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
    // solicitanteId del path es legacy - usar integrante_id del body
    return this.solicitudesService.createOrUpdateForSolicitante(dto);
  }

  @Patch(':solicitanteId')
  async partialUpdate(
    @Param('solicitanteId') solicitanteId: string,
    @Body() data: any,
  ) {
    return this.solicitudesService.partialUpdate(solicitanteId, data);
  }

  @Patch('integrante/:integranteId')
  async partialUpdateByIntegrante(
    @Param('integranteId') integranteId: string,
    @Body() data: any,
  ) {
    return this.solicitudesService.partialUpdate(integranteId, data);
  }
}
