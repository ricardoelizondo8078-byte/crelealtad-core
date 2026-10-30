import { Body, Controller, Get, Put, Req } from '@nestjs/common';
import { RequierePermiso } from '../auth/permissions.decorator';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { ActualizarIntegrantesVerificadasDto } from './dto/actualizar-integrantes-verificadas.dto';
import { ParametrosVerificacionCierreService } from './parametros-verificacion-cierre.service';

@Controller('parametros/verificacion/integrantes-verificadas-para-finalizar')
export class ParametrosVerificacionCierreController {
  constructor(private readonly service: ParametrosVerificacionCierreService) {}

  @Get()
  @RequierePermiso('parametros', 'leer')
  async obtener() {
    return { parametro: await this.service.obtenerVigente() };
  }

  @Put()
  @RequierePermiso('parametros', 'actualizar')
  actualizar(
    @Body() dto: ActualizarIntegrantesVerificadasDto,
    @Req() request: { user: Usuario },
  ) {
    return this.service.actualizar(dto, request.user);
  }
}

@Controller('verificacion/parametros/integrantes-verificadas-para-finalizar')
export class ParametrosVerificacionCierreOperativoController {
  constructor(private readonly service: ParametrosVerificacionCierreService) {}

  @Get()
  @RequierePermiso('verificacion', 'leer')
  async obtener() {
    return { parametro: await this.service.obtenerVigente() };
  }
}
