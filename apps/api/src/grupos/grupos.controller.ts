import { Body, Controller, Post } from '@nestjs/common';
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
}
