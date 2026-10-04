import { Controller, Get, Param, Post, Req } from '@nestjs/common';
import { RequierePermiso } from '../auth/permissions.decorator';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { RenovacionesService } from './renovaciones.service';

@Controller('renovaciones')
export class RenovacionesController {
  constructor(private readonly renovacionesService: RenovacionesService) {}

  @Get('grupos')
  @RequierePermiso('documentacion', 'leer')
  listGrupos(@Req() request: { user: Usuario }) {
    return this.renovacionesService.listGrupos(toScope(request.user));
  }

  @Post('grupos/:grupoId')
  @RequierePermiso('documentacion', 'crear')
  create(@Param('grupoId') grupoId: string, @Req() request: { user: Usuario }) {
    return this.renovacionesService.create(grupoId, toScope(request.user));
  }
}

function toScope(user: Usuario) {
  return { usuarioId: user.id, rolNombre: user.rol.nombre };
}
