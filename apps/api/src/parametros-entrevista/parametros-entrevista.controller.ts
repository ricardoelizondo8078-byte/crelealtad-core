import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { RequierePermiso } from '../auth/permissions.decorator';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { ActualizarParametroEntrevistaDto, CambiarEstadoParametroEntrevistaDto, CrearParametroEntrevistaDto, ListarParametrosEntrevistaDto, ReordenarParametrosEntrevistaDto } from './dto/parametro-entrevista.dto';
import { ParametrosEntrevistaService } from './parametros-entrevista.service';

@Controller('parametros/verificacion/entrevista')
export class ParametrosEntrevistaController {
  constructor(private readonly service: ParametrosEntrevistaService) {}
  @Get() @RequierePermiso('parametros', 'leer')
  listar(@Query() query: ListarParametrosEntrevistaDto) { return this.service.listar(query.familia, query.incluir_inactivos ?? true); }
  @Post() @RequierePermiso('parametros', 'registrar')
  crear(@Body() dto: CrearParametroEntrevistaDto, @Req() req: { user: Usuario }) { return this.service.crear(dto, req.user); }
  @Put('orden') @RequierePermiso('parametros', 'actualizar')
  reordenar(@Body() dto: ReordenarParametrosEntrevistaDto, @Req() req: { user: Usuario }) { return this.service.reordenar(dto, req.user); }
  @Patch(':id/estado') @RequierePermiso('parametros', 'actualizar')
  estado(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: CambiarEstadoParametroEntrevistaDto, @Req() req: { user: Usuario }) { return this.service.cambiarEstado(id, dto, req.user); }
  @Patch(':id') @RequierePermiso('parametros', 'actualizar')
  actualizar(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: ActualizarParametroEntrevistaDto, @Req() req: { user: Usuario }) { return this.service.actualizar(id, dto, req.user); }
}

@Controller('verificacion/parametros/entrevista')
export class ParametrosEntrevistaVerificacionController {
  constructor(private readonly service: ParametrosEntrevistaService) {}
  @Get() @RequierePermiso('verificacion', 'leer') listar() { return this.service.listarActivos(); }
}
