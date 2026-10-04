import {
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Req,
} from '@nestjs/common';
import { ExpedientesService } from './expedientes.service';
import { RequierePermiso } from '../auth/permissions.decorator';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { SeleccionarTesoreraDto } from './dto/seleccionar-tesorera.dto';
import {
  ACCESS_CONTEXT_HEADER,
  VERIFICACION_ACCESS_CONTEXT,
  accessScopeFromContext,
  accessScopeFromUser,
} from '../common/access-scope';

@Controller('expedientes')
export class ExpedientesController {
  constructor(private readonly expedientesService: ExpedientesService) {}

  @Get()
  @RequierePermiso('expedientes', 'leer')
  listAll(@Req() request: { user: Usuario }) {
    return this.expedientesService.listAll(accessScopeFromUser(request.user));
  }

  @Get('group/:groupId')
  @RequierePermiso('expedientes', 'leer')
  listByGroup(@Param('groupId') groupId: string, @Req() request: { user: Usuario }) {
    return this.expedientesService.listByGroup(groupId, accessScopeFromUser(request.user));
  }

  @Get('en-verificacion')
  @RequierePermiso('verificacion', 'leer')
  listEnVerificacion(@Req() request: { user: Usuario }) {
    return this.expedientesService.listEnVerificacion(
      accessScopeFromContext(request.user, VERIFICACION_ACCESS_CONTEXT),
    );
  }

  @Get(':id')
  @RequierePermiso('expedientes', 'leer')
  getById(
    @Param('id') id: string,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context?: string,
  ) {
    return this.expedientesService.getById(
      id,
      accessScopeFromContext(request.user, context),
    );
  }

  @Get(':id/integrantes')
  @RequierePermiso('expedientes', 'leer')
  getIntegrantes(
    @Param('id') id: string,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context?: string,
  ) {
    return this.expedientesService.getIntegrantes(
      id,
      accessScopeFromContext(request.user, context),
    );
  }

  @Patch(':id/send-to-verification')
  @RequierePermiso('expedientes', 'actualizar')
  async sendToVerification(
    @Param('id') id: string,
    @Req() request: { user: Usuario },
  ) {
    const expediente = await this.expedientesService.sendToVerification(
      id,
      accessScopeFromUser(request.user),
    );
    if (!expediente) {
      throw new NotFoundException('Expediente no encontrado');
    }
    return expediente;
  }

  @Patch(':id/tesorera')
  @RequierePermiso('expedientes', 'actualizar')
  seleccionarTesorera(
    @Param('id') id: string,
    @Body() dto: SeleccionarTesoreraDto,
    @Req() request: { user: Usuario },
  ) {
    return this.expedientesService.seleccionarTesorera(
      id,
      dto.integrante_id,
      accessScopeFromUser(request.user),
    );
  }
}
