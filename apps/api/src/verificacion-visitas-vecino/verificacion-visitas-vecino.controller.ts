import {
  Body,
  Controller,
  Get,
  Headers,
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
import {
  ACCESS_CONTEXT_HEADER,
  accessScopeFromContext,
} from '../common/access-scope';
import { RegistrarVisitaVecinoDto } from './dto/registrar-visita-vecino.dto';
import { RegistrarFachadaVisitaVecinoDto } from './dto/registrar-fachada-visita-vecino.dto';
import { RegistrarEvidenciaVisitaVecinoDto } from './dto/registrar-evidencia-visita-vecino.dto';
import { ArchivoFachadaRecibido } from './visita-vecino-fachada-storage.service';
import { VerificacionVisitasVecinoService } from './verificacion-visitas-vecino.service';

@Controller('verificacion/integrantes/:integranteId/visitas-vecino')
export class VerificacionVisitasVecinoController {
  constructor(
    private readonly visitasVecinoService: VerificacionVisitasVecinoService,
  ) {}

  @Get('resumen')
  @RequierePermiso('verificacion', 'leer')
  obtenerResumen(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context?: string,
  ) {
    const scope = accessScopeFromContext(request.user, context);
    return this.visitasVecinoService.obtenerResumen(integranteId, scope);
  }

  @Get('fachadas/resumen')
  @RequierePermiso('verificacion', 'leer')
  obtenerResumenFachada(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context?: string,
  ) {
    const scope = accessScopeFromContext(request.user, context);
    return this.visitasVecinoService.obtenerResumenFachada(integranteId, scope);
  }

  @Post('fachadas')
  @RequierePermiso('verificacion', 'registrar')
  @UseInterceptors(FileInterceptor('foto', { limits: { fileSize: MAX_UPLOAD_FILE_SIZE_BYTES } }))
  registrarFachada(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Body() dto: RegistrarFachadaVisitaVecinoDto,
    @UploadedFile() foto: ArchivoFachadaRecibido | undefined,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context?: string,
  ) {
    const scope = accessScopeFromContext(request.user, context, 'registrar');
    return this.visitasVecinoService.registrarFachada(
      integranteId,
      scope,
      dto,
      foto,
    );
  }

  @Get('fachadas/:fachadaId/archivo')
  @RequierePermiso('verificacion', 'leer')
  async obtenerArchivoFachada(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Param('fachadaId', new ParseUUIDPipe()) fachadaId: string,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const scope = accessScopeFromContext(request.user, context);
    const fachada = await this.visitasVecinoService.obtenerArchivoFachada(
      integranteId,
      fachadaId,
      scope,
    );
    response.set({
      'Content-Type': fachada.mimeType,
      'Cache-Control': 'private, no-store',
      'Content-Disposition': 'inline',
    });
    return new StreamableFile(fachada.contenido);
  }

  @Get(':visitaId/evidencias/resumen')
  @RequierePermiso('verificacion', 'leer')
  obtenerResumenEvidencia(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Param('visitaId', new ParseUUIDPipe()) visitaId: string,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context?: string,
  ) {
    const scope = accessScopeFromContext(request.user, context);
    return this.visitasVecinoService.obtenerResumenEvidencia(
      integranteId,
      visitaId,
      scope,
    );
  }

  @Post(':visitaId/evidencias')
  @RequierePermiso('verificacion', 'registrar')
  @UseInterceptors(FileInterceptor('foto', { limits: { fileSize: MAX_UPLOAD_FILE_SIZE_BYTES } }))
  registrarEvidencia(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Param('visitaId', new ParseUUIDPipe()) visitaId: string,
    @Body() dto: RegistrarEvidenciaVisitaVecinoDto,
    @UploadedFile() foto: ArchivoFachadaRecibido | undefined,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context?: string,
  ) {
    const scope = accessScopeFromContext(request.user, context, 'registrar');
    return this.visitasVecinoService.registrarEvidencia(
      integranteId,
      visitaId,
      scope,
      dto,
      foto,
    );
  }

  @Get(':visitaId/evidencias/:evidenciaId/archivo')
  @RequierePermiso('verificacion', 'leer')
  async obtenerArchivoEvidencia(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Param('visitaId', new ParseUUIDPipe()) visitaId: string,
    @Param('evidenciaId', new ParseUUIDPipe()) evidenciaId: string,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const scope = accessScopeFromContext(request.user, context);
    const evidencia = await this.visitasVecinoService.obtenerArchivoEvidencia(
      integranteId,
      visitaId,
      evidenciaId,
      scope,
    );
    response.set({
      'Content-Type': evidencia.mimeType,
      'Cache-Control': 'private, no-store',
      'Content-Disposition': 'inline',
    });
    return new StreamableFile(evidencia.contenido);
  }

  @Post()
  @RequierePermiso('verificacion', 'registrar')
  registrar(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Body() dto: RegistrarVisitaVecinoDto,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context?: string,
  ) {
    const scope = accessScopeFromContext(request.user, context, 'registrar');
    return this.visitasVecinoService.registrar(integranteId, scope, dto);
  }
}
