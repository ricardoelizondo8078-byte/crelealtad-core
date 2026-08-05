import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { GruposService } from './grupos.service';
import { PaginationDto } from '../common/dto/pagination.dto';

export class CreateGrupoDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(1, { message: 'El nombre no puede estar vacío' })
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  name: string;

  @IsOptional()
  @IsString()
  advisorName?: string;

  @IsOptional()
  @IsString()
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
  listAll(@Query() paginationDto: PaginationDto) {
    return this.gruposService.listAll(paginationDto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.gruposService.getById(id);
  }
}
