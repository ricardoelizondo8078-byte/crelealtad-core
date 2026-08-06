import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { GruposService } from './grupos.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { Public } from '../auth/public.decorator';

@Controller('grupos')
export class GruposController {
  constructor(private readonly gruposService: GruposService) {}

  @Post()
  create(@Body() dto: CreateGrupoDto) {
    return this.gruposService.create(dto);
  }

  @Get()
  listAll(@Query() paginationDto: PaginationDto) {
    return this.gruposService.listAll(paginationDto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.gruposService.getById(id);
  }
}
