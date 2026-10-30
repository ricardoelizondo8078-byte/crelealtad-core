import { Body, Controller, Get, Put, Req } from '@nestjs/common';
import { RequierePermiso } from '../auth/permissions.decorator';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { ActualizarSemanaCreditoDto } from './dto/actualizar-semana-credito.dto';
import { ActualizarCiclosCreditoDto } from './dto/actualizar-ciclos-credito.dto';
import { ActualizarToleranciaSemanaDesembolsoDto } from './dto/actualizar-tolerancia-semana-desembolso.dto';
import { ActualizarConcordanciaPorcentajeDto } from './dto/actualizar-concordancia-porcentaje.dto';
import { ParametrosConclusionesService } from './parametros-conclusiones.service';

@Controller('parametros/verificacion/conclusiones')
export class ParametrosConclusionesController {
  constructor(private readonly service: ParametrosConclusionesService) {}

  @Get('calificacion-semana-credito')
  @RequierePermiso('parametros', 'leer')
  obtenerSemanaCredito() {
    return this.service.obtenerSemanaCredito();
  }

  @Put('calificacion-semana-credito')
  @RequierePermiso('parametros', 'actualizar')
  actualizarSemanaCredito(
    @Body() dto: ActualizarSemanaCreditoDto,
    @Req() req: { user: Usuario },
  ) {
    return this.service.actualizarSemanaCredito(dto, req.user);
  }

  @Get('calificacion-ciclos-credito')
  @RequierePermiso('parametros', 'leer')
  obtenerCiclosCredito() {
    return this.service.obtenerCiclosCredito();
  }

  @Put('calificacion-ciclos-credito')
  @RequierePermiso('parametros', 'actualizar')
  actualizarCiclosCredito(
    @Body() dto: ActualizarCiclosCreditoDto,
    @Req() req: { user: Usuario },
  ) {
    return this.service.actualizarCiclosCredito(dto, req.user);
  }

  @Get('tolerancia-semana-desembolso')
  @RequierePermiso('parametros', 'leer')
  obtenerToleranciaSemanaDesembolso() {
    return this.service.obtenerToleranciaSemanaDesembolso();
  }

  @Put('tolerancia-semana-desembolso')
  @RequierePermiso('parametros', 'actualizar')
  actualizarToleranciaSemanaDesembolso(
    @Body() dto: ActualizarToleranciaSemanaDesembolsoDto,
    @Req() req: { user: Usuario },
  ) {
    return this.service.actualizarToleranciaSemanaDesembolso(dto, req.user);
  }

  @Get('concordancia-ficha')
  @RequierePermiso('parametros', 'leer')
  obtenerConcordanciaFicha() {
    return this.service.obtenerConcordanciaFicha();
  }

  @Put('concordancia-ficha')
  @RequierePermiso('parametros', 'actualizar')
  actualizarConcordanciaFicha(
    @Body() dto: ActualizarConcordanciaPorcentajeDto,
    @Req() req: { user: Usuario },
  ) {
    return this.service.actualizarConcordanciaFicha(dto, req.user);
  }

  @Get('concordancia-prestamo')
  @RequierePermiso('parametros', 'leer')
  obtenerConcordanciaPrestamo() {
    return this.service.obtenerConcordanciaPrestamo();
  }

  @Put('concordancia-prestamo')
  @RequierePermiso('parametros', 'actualizar')
  actualizarConcordanciaPrestamo(
    @Body() dto: ActualizarConcordanciaPorcentajeDto,
    @Req() req: { user: Usuario },
  ) {
    return this.service.actualizarConcordanciaPrestamo(dto, req.user);
  }

  @Get('calificacion-promedio-evidencias')
  @RequierePermiso('parametros', 'leer')
  obtenerPromedioEvidencias() {
    return this.service.obtenerPromedioEvidencias();
  }

  @Put('calificacion-promedio-evidencias')
  @RequierePermiso('parametros', 'actualizar')
  actualizarPromedioEvidencias(
    @Body() dto: ActualizarConcordanciaPorcentajeDto,
    @Req() req: { user: Usuario },
  ) {
    return this.service.actualizarPromedioEvidencias(dto, req.user);
  }
}

@Controller('verificacion/parametros/conclusiones')
export class ParametrosConclusionesVerificacionController {
  constructor(private readonly service: ParametrosConclusionesService) {}

  @Get('calificacion-semana-credito')
  @RequierePermiso('verificacion', 'leer')
  obtenerSemanaCredito() {
    return this.service.obtenerSemanaCredito();
  }

  @Get('calificacion-ciclos-credito')
  @RequierePermiso('verificacion', 'leer')
  obtenerCiclosCredito() {
    return this.service.obtenerCiclosCredito();
  }

  @Get('tolerancia-semana-desembolso')
  @RequierePermiso('verificacion', 'leer')
  obtenerToleranciaSemanaDesembolso() {
    return this.service.obtenerToleranciaSemanaDesembolso();
  }

  @Get('concordancia-ficha')
  @RequierePermiso('verificacion', 'leer')
  obtenerConcordanciaFicha() {
    return this.service.obtenerConcordanciaFicha();
  }

  @Get('concordancia-prestamo')
  @RequierePermiso('verificacion', 'leer')
  obtenerConcordanciaPrestamo() {
    return this.service.obtenerConcordanciaPrestamo();
  }

  @Get('calificacion-promedio-evidencias')
  @RequierePermiso('verificacion', 'leer')
  obtenerPromedioEvidencias() {
    return this.service.obtenerPromedioEvidencias();
  }
}
