import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { DocumentoTipo, DocumentoEstado } from './documento.entity';
import { DocumentosService } from './documentos.service';

class UpdateDocumentoEstadoDto {
  estado: DocumentoEstado;
}

class CargarDocumentoDto {
  tipo: DocumentoTipo;
  archivoBase64: string;
  archivoNombre: string;
}

@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Get('solicitante/:solicitanteId')
  listBySolicitante(@Param('solicitanteId') solicitanteId: string) {
    return this.documentosService.listBySolicitante(solicitanteId);
  }

  @Post('solicitante/:solicitanteId')
  cargarDocumento(
    @Param('solicitanteId') solicitanteId: string,
    @Body() dto: CargarDocumentoDto,
  ) {
    return this.documentosService.cargarDocumento(
      solicitanteId,
      dto.tipo,
      dto.archivoBase64,
      dto.archivoNombre,
    );
  }

  @Patch(':id/verificar')
  verificarDocumento(@Param('id') id: string) {
    return this.documentosService.verificarDocumento(id);
  }

  @Patch('solicitante/:solicitanteId/:tipo')
  updateStatus(
    @Param('solicitanteId') solicitanteId: string,
    @Param('tipo') tipo: DocumentoTipo,
    @Body() dto: UpdateDocumentoEstadoDto,
  ) {
    return this.documentosService.updateStatus(solicitanteId, tipo, dto.estado);
  }
}