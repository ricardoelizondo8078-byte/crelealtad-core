import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Res,
  StreamableFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  DOCUMENT_FILES_MULTIPART_OPTIONS,
  MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST,
} from '../common/files/upload-file.policy';
import { SolicitudesService } from './solicitudes.service';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { PartialUpdateSolicitudDto } from './dto/partial-update-solicitud.dto';
import { CargaDocumentoDto } from './dto/carga-documento.dto';
import { RequierePermiso } from '../auth/permissions.decorator';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { ArchivoDocumentoRecibido } from './documentos/documentos.types';
import {
  ACCESS_CONTEXT_HEADER,
  accessScopeFromContext,
  accessScopeFromUser,
} from '../common/access-scope';

@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @Get('integrante/:integranteId')
  @RequierePermiso('solicitudes', 'leer')
  getByIntegrante(
    @Param('integranteId') integranteId: string,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context?: string,
  ) {
    return this.solicitudesService.getBySolicitante(
      integranteId,
      accessScopeFromContext(request.user, context),
    );
  }

  @Post()
  @RequierePermiso('solicitudes', 'crear')
  create(@Body() dto: CreateSolicitudDto, @Req() request: { user: Usuario }) {
    return this.solicitudesService.createOrUpdateForSolicitante(
      dto,
      accessScopeFromUser(request.user),
    );
  }

  @Post('integrante/:integranteId/documentos/:tipo')
  @RequierePermiso('solicitudes', 'actualizar')
  @UseInterceptors(FilesInterceptor(
    'archivos',
    MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST,
    DOCUMENT_FILES_MULTIPART_OPTIONS,
  ))
  subirDocumento(
    @Param('integranteId') integranteId: string,
    @Param('tipo') tipo: string,
    @Body() carga: CargaDocumentoDto,
    @UploadedFiles() archivos: ArchivoDocumentoRecibido[],
    @Req() request: { user: Usuario },
  ) {
    return this.solicitudesService.subirDocumento(
      integranteId,
      tipo,
      accessScopeFromUser(request.user),
      archivos,
      carga,
    );
  }

  @Get('integrante/:integranteId/documentos/:tipo/:documentoId')
  @RequierePermiso('solicitudes', 'leer')
  obtenerDocumento(
    @Param('integranteId') integranteId: string,
    @Param('tipo') tipo: string,
    @Param('documentoId') documentoId: string,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context?: string,
  ) {
    return this.solicitudesService.obtenerDocumento(
      integranteId,
      tipo,
      documentoId,
      accessScopeFromContext(request.user, context),
    );
  }

  @Get('integrante/:integranteId/documentos/:tipo/:documentoId/archivos/:indice')
  @RequierePermiso('solicitudes', 'leer')
  async obtenerArchivoDocumento(
    @Param('integranteId') integranteId: string,
    @Param('tipo') tipo: string,
    @Param('documentoId') documentoId: string,
    @Param('indice', ParseIntPipe) indice: number,
    @Res({ passthrough: true }) response: Response,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context?: string,
  ) {
    const archivo = await this.solicitudesService.leerArchivoDocumento(
      integranteId,
      tipo,
      documentoId,
      indice,
      accessScopeFromContext(request.user, context),
    );
    response.set({
      'Content-Type': archivo.mimeType,
      'Cache-Control': 'private, no-store',
      'Content-Disposition': 'inline',
    });
    return new StreamableFile(archivo.contenido);
  }

  @Patch('integrante/:integranteId')
  @RequierePermiso('solicitudes', 'actualizar')
  async partialUpdateByIntegrante(
    @Param('integranteId') integranteId: string,
    @Body() data: PartialUpdateSolicitudDto,
    @Req() request: { user: Usuario },
  ) {
    return this.solicitudesService.partialUpdate(
      integranteId,
      data,
      accessScopeFromUser(request.user),
    );
  }
}
