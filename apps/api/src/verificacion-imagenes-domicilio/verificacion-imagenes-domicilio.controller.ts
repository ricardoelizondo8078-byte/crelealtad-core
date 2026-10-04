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
import { SINGLE_FILE_MULTIPART_OPTIONS } from '../common/files/upload-file.policy';
import { RequierePermiso } from '../auth/permissions.decorator';
import { Usuario } from '../catalogos/entities/usuario.entity';
import {
  ACCESS_CONTEXT_HEADER,
  accessScopeFromContext,
} from '../common/access-scope';
import { RegistrarImagenDomicilioDto } from './dto/registrar-imagen-domicilio.dto';
import { RegistrarMedidorLuzRespuestaDto } from './dto/registrar-medidor-luz-respuesta.dto';
import { ArchivoImagenDomicilioRecibido } from './imagenes-domicilio-storage.service';
import { VerificacionImagenesDomicilioService } from './verificacion-imagenes-domicilio.service';

@Controller('verificacion/integrantes/:integranteId/imagenes-domicilio')
export class VerificacionImagenesDomicilioController {
  constructor(
    private readonly imagenesDomicilioService: VerificacionImagenesDomicilioService,
  ) {}

  @Get('resumen')
  @RequierePermiso('verificacion', 'leer')
  obtenerResumen(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context?: string,
  ) {
    const scope = accessScopeFromContext(request.user, context);
    return this.imagenesDomicilioService.obtenerResumen(integranteId, scope);
  }

  @Post()
  @RequierePermiso('verificacion', 'registrar')
  @UseInterceptors(FileInterceptor('foto', SINGLE_FILE_MULTIPART_OPTIONS))
  registrar(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Body() dto: RegistrarImagenDomicilioDto,
    @UploadedFile() foto: ArchivoImagenDomicilioRecibido | undefined,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context?: string,
  ) {
    const scope = accessScopeFromContext(request.user, context, 'registrar');
    return this.imagenesDomicilioService.registrar(
      integranteId,
      scope,
      dto,
      foto,
    );
  }

  @Post('medidor-luz/respuesta')
  @RequierePermiso('verificacion', 'registrar')
  registrarRespuestaMedidor(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Body() dto: RegistrarMedidorLuzRespuestaDto,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context?: string,
  ) {
    const scope = accessScopeFromContext(request.user, context, 'registrar');
    return this.imagenesDomicilioService.registrarRespuestaMedidor(
      integranteId,
      scope,
      dto,
    );
  }

  @Get(':imagenId/archivo')
  @RequierePermiso('verificacion', 'leer')
  async obtenerArchivo(
    @Param('integranteId', new ParseUUIDPipe()) integranteId: string,
    @Param('imagenId', new ParseUUIDPipe()) imagenId: string,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const scope = accessScopeFromContext(request.user, context);
    const imagen = await this.imagenesDomicilioService.obtenerArchivo(
      integranteId,
      imagenId,
      scope,
    );
    response.set({
      'Content-Type': imagen.mimeType,
      'Cache-Control': 'private, no-store',
      'Content-Disposition': 'inline',
    });
    return new StreamableFile(imagen.contenido);
  }
}
