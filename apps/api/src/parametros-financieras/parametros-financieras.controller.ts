import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { RequierePermiso } from '../auth/permissions.decorator';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { PublicarCambioFinancieraDto } from './dto/publicar-cambio-financiera.dto';
import { ParametrosFinancierasService } from './parametros-financieras.service';

@Controller('parametros/financieras-competidoras')
export class ParametrosFinancierasController {
  constructor(private readonly service: ParametrosFinancierasService) {}

  @Get()
  @RequierePermiso('parametros', 'leer')
  listar() {
    return this.service.listar();
  }

  @Get(':financieraId/historial')
  @RequierePermiso('parametros', 'leer')
  listarHistorial(
    @Param('financieraId', new ParseUUIDPipe()) financieraId: string,
  ) {
    return this.service.listarHistorial(financieraId);
  }

  @Post('publicaciones')
  @RequierePermiso('parametros', 'registrar')
  publicarCambio(
    @Body() dto: PublicarCambioFinancieraDto,
    @Req() request: { user: Usuario },
  ) {
    return this.service.publicarCambio(dto, request.user);
  }
}

@Controller('verificacion/financieras-competidoras')
export class FinancierasCompetidorasVerificacionController {
  constructor(private readonly service: ParametrosFinancierasService) {}

  @Get()
  @RequierePermiso('verificacion', 'leer')
  listarVigentes(@Query('fecha') fecha?: string) {
    return this.service.listarVigentes(fecha);
  }
}
