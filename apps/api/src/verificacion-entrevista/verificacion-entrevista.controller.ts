import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
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
import { ArchivoEvidenciaEntrevistaRecibido } from './entrevista-evidencia-storage.service';
import { GuardarEntrevistaDto } from './dto/guardar-entrevista.dto';
import { RegistrarEvidenciaEntrevistaDto } from './dto/registrar-evidencia-entrevista.dto';
import { VerificacionEntrevistaService } from './verificacion-entrevista.service';

@Controller('verificacion/integrantes/:integranteId/entrevista')
export class VerificacionEntrevistaController {
  constructor(private readonly entrevistaService: VerificacionEntrevistaService) {}

  @Get()
  @RequierePermiso('verificacion', 'leer')
  obtenerEntrevista(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context?: string,
  ) {
    return this.entrevistaService.obtenerEntrevista(
      integranteId,
      accessScopeFromContext(request.user, context),
    );
  }

  @Put()
  @RequierePermiso('verificacion', 'registrar')
  guardarEntrevista(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Body() dto: GuardarEntrevistaDto,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context?: string,
  ) {
    return this.entrevistaService.guardarEntrevista(
      integranteId,
      accessScopeFromContext(request.user, context, 'registrar'),
      dto,
    );
  }

  @Get('evidencias')
  @RequierePermiso('verificacion', 'leer')
  obtenerEvidencias(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context?: string,
  ) {
    return this.entrevistaService.obtenerEvidencias(
      integranteId,
      accessScopeFromContext(request.user, context),
    );
  }

  @Post('evidencias')
  @RequierePermiso('verificacion', 'registrar')
  @UseInterceptors(FileInterceptor('foto', { limits: { fileSize: MAX_UPLOAD_FILE_SIZE_BYTES } }))
  registrarEvidencia(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Body() dto: RegistrarEvidenciaEntrevistaDto,
    @UploadedFile() foto: ArchivoEvidenciaEntrevistaRecibido | undefined,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context?: string,
  ) {
    return this.entrevistaService.registrarEvidencia(
      integranteId,
      accessScopeFromContext(request.user, context, 'registrar'),
      dto,
      foto,
    );
  }

  @Get('evidencias/:evidenciaId/archivo')
  @RequierePermiso('verificacion', 'leer')
  async obtenerArchivo(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Param('evidenciaId', new ParseUUIDPipe()) evidenciaId: string,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const evidencia = await this.entrevistaService.obtenerArchivo(
      integranteId,
      evidenciaId,
      accessScopeFromContext(request.user, context),
    );
    response.set({
      'Content-Type': evidencia.mimeType,
      'Cache-Control': 'private, no-store',
      'Content-Disposition': 'inline',
    });
    return new StreamableFile(evidencia.contenido);
  }
}
