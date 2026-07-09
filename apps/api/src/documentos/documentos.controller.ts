import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { DocumentoClave, DocumentoEstado } from './documentos.entity';
import { DocumentosService } from './documentos.service';

class UpdateDocumentoEstadoDto {
  estado: DocumentoEstado;
}

@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Get('solicitante/:solicitanteId')
  listBySolicitante(@Param('solicitanteId') solicitanteId: string) {
    return this.documentosService.listBySolicitante(solicitanteId);
  }

  @Patch('solicitante/:solicitanteId/:clave')
  updateStatus(
    @Param('solicitanteId') solicitanteId: string,
    @Param('clave') clave: DocumentoClave,
    @Body() dto: UpdateDocumentoEstadoDto,
  ) {
    return this.documentosService.updateStatus(solicitanteId, clave, dto.estado);
  }
}