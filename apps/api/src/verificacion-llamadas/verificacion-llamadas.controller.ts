import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { MAX_UPLOAD_FILE_SIZE_BYTES } from '../common/files/upload-file.policy';
import { RequierePermiso } from '../auth/permissions.decorator';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { RegistrarEncuestaLlamadaDto } from './dto/registrar-encuesta-llamada.dto';
import { RegistrarConfirmacionTelefonoDto } from './dto/registrar-confirmacion-telefono.dto';
import { RegistrarLlamadaVerificacionDto } from './dto/registrar-llamada.dto';
import { ArchivoEvidenciaLlamadaRecibido } from './llamada-evidencia-storage.service';
import { VerificacionLlamadasService } from './verificacion-llamadas.service';

@Controller('verificacion/integrantes/:integranteId/llamadas')
export class VerificacionLlamadasController {
  constructor(private readonly llamadasService: VerificacionLlamadasService) {}

  @Get('resumen')
  @RequierePermiso('verificacion', 'leer')
  obtenerResumen(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
  ) {
    return this.llamadasService.obtenerResumen(integranteId);
  }

  @Post()
  @RequierePermiso('verificacion', 'registrar')
  registrar(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Body() dto: RegistrarLlamadaVerificacionDto,
    @Req() request: { user: Usuario },
  ) {
    return this.llamadasService.registrar(integranteId, request.user.id, dto);
  }

  @Post(':llamadaId/encuesta')
  @RequierePermiso('verificacion', 'registrar')
  @UseInterceptors(FileInterceptor('evidencia', { limits: { fileSize: MAX_UPLOAD_FILE_SIZE_BYTES } }))
  registrarEncuesta(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Param('llamadaId', new ParseUUIDPipe()) llamadaId: string,
    @Body() dto: RegistrarEncuestaLlamadaDto,
    @UploadedFile() evidencia: ArchivoEvidenciaLlamadaRecibido | undefined,
    @Req() request: { user: Usuario },
  ) {
    return this.llamadasService.registrarEncuesta(
      integranteId,
      llamadaId,
      request.user.id,
      dto,
      evidencia,
    );
  }

  @Get(':llamadaId/evidencia')
  @RequierePermiso('verificacion', 'leer')
  async obtenerEvidencia(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Param('llamadaId', new ParseUUIDPipe()) llamadaId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const evidencia = await this.llamadasService.obtenerEvidencia(integranteId, llamadaId);
    response.set({
      'Content-Type': evidencia.mimeType,
      'Cache-Control': 'private, no-store',
      'Content-Disposition': 'inline',
    });
    return new StreamableFile(evidencia.contenido);
  }

  @Post(':llamadaId/confirmacion-telefono')
  @RequierePermiso('verificacion', 'registrar')
  @UseInterceptors(FileInterceptor('evidencia', { limits: { fileSize: MAX_UPLOAD_FILE_SIZE_BYTES } }))
  registrarConfirmacionTelefono(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Param('llamadaId', new ParseUUIDPipe()) llamadaId: string,
    @Body() dto: RegistrarConfirmacionTelefonoDto,
    @UploadedFile() evidencia: ArchivoEvidenciaLlamadaRecibido | undefined,
    @Req() request: { user: Usuario },
  ) {
    return this.llamadasService.registrarConfirmacionTelefono(
      integranteId,
      llamadaId,
      request.user.id,
      dto,
      evidencia,
    );
  }

  @Get(':llamadaId/confirmacion-telefono/evidencia')
  @RequierePermiso('verificacion', 'leer')
  async obtenerEvidenciaConfirmacionTelefono(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Param('llamadaId', new ParseUUIDPipe()) llamadaId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const evidencia = await this.llamadasService.obtenerEvidenciaConfirmacionTelefono(
      integranteId,
      llamadaId,
    );
    response.set({
      'Content-Type': evidencia.mimeType,
      'Cache-Control': 'private, no-store',
      'Content-Disposition': 'inline',
    });
    return new StreamableFile(evidencia.contenido);
  }

  @Get(':llamadaId/confirmacion-telefono/evidencia-actual')
  @RequierePermiso('verificacion', 'leer')
  async obtenerEvidenciaTelefonoActual(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Param('llamadaId', new ParseUUIDPipe()) llamadaId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const evidencia = await this.llamadasService.obtenerEvidenciaTelefonoActual(
      integranteId,
      llamadaId,
    );
    response.set({
      'Content-Type': evidencia.mimeType,
      'Cache-Control': 'private, no-store',
      'Content-Disposition': 'inline',
    });
    return new StreamableFile(evidencia.contenido);
  }

  @Post(':llamadaId/confirmacion-telefono/reemplazo-evidencia')
  @RequierePermiso('verificacion', 'registrar')
  @UseInterceptors(FileInterceptor('evidencia', { limits: { fileSize: MAX_UPLOAD_FILE_SIZE_BYTES } }))
  reemplazarEvidenciaTelefono(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Param('llamadaId', new ParseUUIDPipe()) llamadaId: string,
    @Body() dto: RegistrarConfirmacionTelefonoDto,
    @UploadedFile() evidencia: ArchivoEvidenciaLlamadaRecibido | undefined,
    @Req() request: { user: Usuario },
  ) {
    return this.llamadasService.reemplazarEvidenciaTelefono(
      integranteId,
      llamadaId,
      request.user.id,
      dto,
      evidencia,
    );
  }
}
