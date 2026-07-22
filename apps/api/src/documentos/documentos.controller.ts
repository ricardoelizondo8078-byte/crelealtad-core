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

  @Get('integrante/:integranteId')
  listByIntegrante(@Param('integranteId') integranteId: string) {
    return this.documentosService.listBySolicitante(integranteId);
  }

  @Post('integrante/:integranteId')
  async cargarDocumento(
    @Param('integranteId') integranteId: string,
    @Body() dto: CargarDocumentoDto,
  ) {
    return this.documentosService.cargarDocumento(
      integranteId,
      dto.tipo,
      dto.archivoBase64,
      dto.archivoNombre,
    );
  }

  @Patch(':id/verificar')
  verificarDocumento(@Param('id') id: string) {
    return this.documentosService.verificarDocumento(id);
  }

  @Patch('integrante/:integranteId/:tipo')
  async updateStatus(
    @Param('integranteId') integranteId: string,
    @Param('tipo') tipo: DocumentoTipo,
    @Body() dto: UpdateDocumentoEstadoDto,
  ) {
    return this.documentosService.updateStatus(integranteId, tipo, dto.estado);
  }
}
