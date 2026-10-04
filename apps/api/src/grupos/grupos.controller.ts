import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { GruposService } from './grupos.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { RequierePermiso } from '../auth/permissions.decorator';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { accessScopeFromUser } from '../common/access-scope';

@Controller('grupos')
export class GruposController {
  constructor(private readonly gruposService: GruposService) {}

  @Post()
  @RequierePermiso('documentacion', 'crear')
  create(@Body() dto: CreateGrupoDto, @Req() request: { user: Usuario }) {
    return this.gruposService.create(dto, accessScopeFromUser(request.user));
  }

  @Get()
  @RequierePermiso('documentacion', 'leer')
  listAll(@Query() paginationDto: PaginationDto, @Req() request: { user: Usuario }) {
    return this.gruposService.listAll(paginationDto, accessScopeFromUser(request.user));
  }

  @Get(':id')
  @RequierePermiso('documentacion', 'leer')
  getById(@Param('id') id: string, @Req() request: { user: Usuario }) {
    return this.gruposService.getById(id, accessScopeFromUser(request.user));
  }
}
