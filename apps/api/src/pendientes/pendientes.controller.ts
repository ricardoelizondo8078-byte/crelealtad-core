import { Controller, Get, Req } from '@nestjs/common';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { RequierePermiso } from '../auth/permissions.decorator';
import { PendientesService } from './pendientes.service';

@Controller('pendientes')
export class PendientesController {
  constructor(private readonly pendientesService: PendientesService) {}

  @Get('revision-documental')
  @RequierePermiso('expedientes', 'leer')
  listRevisionDocumental(@Req() request: { user: Usuario }) {
    return this.pendientesService.listRevisionDocumental(request.user.id);
  }
}
