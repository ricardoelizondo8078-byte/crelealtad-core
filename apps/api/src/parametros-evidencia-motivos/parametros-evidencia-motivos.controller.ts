import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Put,
} from '@nestjs/common';
import { RequierePermiso } from '../auth/permissions.decorator';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { ActualizarMotivoClasificacionEvidenciaDto } from './dto/actualizar-motivo-clasificacion-evidencia.dto';
import { CambiarEstadoMotivoClasificacionEvidenciaDto } from './dto/cambiar-estado-motivo-clasificacion-evidencia.dto';
import { CrearMotivoClasificacionEvidenciaDto } from './dto/crear-motivo-clasificacion-evidencia.dto';
import { ListarMotivosClasificacionEvidenciaDto } from './dto/listar-motivos-clasificacion-evidencia.dto';
import { ReordenarMotivosClasificacionEvidenciaDto } from './dto/reordenar-motivos-clasificacion-evidencia.dto';
import { ParametrosEvidenciaMotivosService } from './parametros-evidencia-motivos.service';

@Controller('parametros/evidencia/motivos-clasificacion')
export class ParametrosEvidenciaMotivosController {
  constructor(private readonly service: ParametrosEvidenciaMotivosService) {}

  @Get()
  @RequierePermiso('parametros', 'leer')
  listar(@Query() query: ListarMotivosClasificacionEvidenciaDto) {
    return this.service.listar(query.clasificacion, query.incluir_inactivos ?? true);
  }

  @Post()
  @RequierePermiso('parametros', 'registrar')
  crear(
    @Body() dto: CrearMotivoClasificacionEvidenciaDto,
    @Req() request: { user: Usuario },
  ) {
    return this.service.crear(dto, request.user);
  }

  @Put('orden')
  @RequierePermiso('parametros', 'actualizar')
  reordenar(
    @Body() dto: ReordenarMotivosClasificacionEvidenciaDto,
    @Req() request: { user: Usuario },
  ) {
    return this.service.reordenar(dto, request.user);
  }

  @Patch(':motivoId/estado')
  @RequierePermiso('parametros', 'actualizar')
  cambiarEstado(
    @Param('motivoId', new ParseUUIDPipe()) motivoId: string,
    @Body() dto: CambiarEstadoMotivoClasificacionEvidenciaDto,
    @Req() request: { user: Usuario },
  ) {
    return this.service.cambiarEstado(motivoId, dto, request.user);
  }

  @Patch(':motivoId')
  @RequierePermiso('parametros', 'actualizar')
  actualizarConcepto(
    @Param('motivoId', new ParseUUIDPipe()) motivoId: string,
    @Body() dto: ActualizarMotivoClasificacionEvidenciaDto,
    @Req() request: { user: Usuario },
  ) {
    return this.service.actualizarConcepto(motivoId, dto, request.user);
  }
}

@Controller('verificacion/evidencia/motivos-clasificacion')
export class MotivosClasificacionEvidenciaVerificacionController {
  constructor(private readonly service: ParametrosEvidenciaMotivosService) {}

  @Get()
  @RequierePermiso('verificacion', 'leer')
  listarActivos() {
    return this.service.listarActivos();
  }
}
