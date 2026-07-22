import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GruposService } from './grupos.service';

export class CreateGrupoDto {
  name: string;
  advisorName?: string;
  createdBy?: string;
}

@Controller('grupos')
export class GruposController {
  constructor(private readonly gruposService: GruposService) {}

  @Post()
  create(@Body() dto: CreateGrupoDto) {
    return this.gruposService.create(dto);
  }

  @Get()
  listAll() {
    return this.gruposService.listAll();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.gruposService.getById(id);
  }
}
