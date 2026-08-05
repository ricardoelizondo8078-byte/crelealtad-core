import { Body, Controller, Get, Param, Post, Patch } from '@nestjs/common';
import { IsString, IsOptional, IsNumber, IsEnum, IsUUID } from 'class-validator';
import { IntegrantesService } from './integrantes.service';
import { IntegranteEstado } from './integrante.entity';

class CreateIntegranteDto {
  @IsOptional()
  @IsString()
  expedienteId?: string;

  @IsOptional()
  @IsString()
  expediente_id?: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  nombres?: string;

  @IsOptional()
  @IsString()
  apellidoPaterno?: string;

  @IsOptional()
  @IsString()
  apellidoMaterno?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsNumber()
  montoSolicitado?: number;

  @IsOptional()
  @IsUUID()
  persona_id?: string;
}

class UpdateEstadoDto {
  @IsEnum(IntegranteEstado)
  estado: IntegranteEstado.EN_VERIFICACION | IntegranteEstado.AUTORIZADA | IntegranteEstado.RECHAZADA | IntegranteEstado.SUJETA_CREDITO;
}

class UpdateIntegranteDto {
  @IsOptional()
  @IsUUID()
  persona_id?: string;

  @IsOptional()
  @IsString()
  nombres?: string;

  @IsOptional()
  @IsString()
  apellido_pat?: string;

  @IsOptional()
  @IsString()
  apellido_mat?: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  telefonoSecundario?: string;

  @IsOptional()
  @IsString()
  telefono_secundario?: string;

  @IsOptional()
  @IsNumber()
  montoSolicitado?: number;
}

@Controller('integrantes')
export class IntegrantesController {
  constructor(private readonly integrantesService: IntegrantesService) {}

  @Get('expediente/:expedienteId')
  listByExpediente(@Param('expedienteId') expedienteId: string) {
    return this.integrantesService.listByExpediente(expedienteId);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.integrantesService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateIntegranteDto) {
    return this.integrantesService.createForExpediente(dto);
  }

  @Patch(':id/estado')
  updateEstado(@Param('id') id: string, @Body() dto: UpdateEstadoDto) {
    return this.integrantesService.updateEstadoManual(id, dto.estado);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateIntegranteDto) {
    return this.integrantesService.update(id, dto);
  }
}
