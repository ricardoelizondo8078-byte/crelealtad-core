import { Body, Controller, Get, Headers, Param, Post, Patch, Req } from '@nestjs/common';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { IntegrantesService } from './integrantes.service';
import { IntegranteEstado } from './integrante.entity';
import { RequierePermiso } from '../auth/permissions.decorator';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { RetirarIntegranteDto } from './dto/retirar-integrante.dto';
import {
  TipoDocumentoRevision,
  TIPOS_DOCUMENTO_REVISION,
} from './integrantes-revision-documental.types';
import {
  ACCESS_CONTEXT_HEADER,
  accessScopeFromContext,
  accessScopeFromUser,
} from '../common/access-scope';

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

}

class UpdateEstadoDto {
  @IsEnum(IntegranteEstado)
  estado:
    | IntegranteEstado.DOCUMENTANDO
    | IntegranteEstado.EN_VERIFICACION
    | IntegranteEstado.AUTORIZADA
    | IntegranteEstado.RECHAZADA
    | IntegranteEstado.SUJETA_CREDITO;

  @ValidateIf((dto: UpdateEstadoDto) => dto.estado === IntegranteEstado.DOCUMENTANDO)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsIn(TIPOS_DOCUMENTO_REVISION, { each: true })
  documentos_observados?: TipoDocumentoRevision[];
}

class UpdateIntegranteDto {
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
  @RequierePermiso('expedientes', 'leer')
  listByExpediente(
    @Param('expedienteId') expedienteId: string,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context?: string,
  ) {
    return this.integrantesService.listByExpediente(
      expedienteId,
      accessScopeFromContext(request.user, context),
    );
  }

  @Get(':id')
  @RequierePermiso('expedientes', 'leer')
  getById(
    @Param('id') id: string,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context?: string,
  ) {
    return this.integrantesService.getById(
      id,
      accessScopeFromContext(request.user, context),
    );
  }

  @Post()
  @RequierePermiso('expedientes', 'crear')
  create(@Body() dto: CreateIntegranteDto, @Req() request: { user: Usuario }) {
    return this.integrantesService.createForExpediente(
      dto,
      accessScopeFromUser(request.user),
    );
  }

  @Patch(':id/estado')
  @RequierePermiso('expedientes', 'actualizar')
  updateEstado(
    @Param('id') id: string,
    @Body() dto: UpdateEstadoDto,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context?: string,
  ) {
    return this.integrantesService.updateEstadoManual(
      id,
      dto.estado,
      accessScopeFromContext(request.user, context, 'registrar'),
      dto.documentos_observados,
    );
  }

  @Patch(':id/retirar')
  @RequierePermiso('expedientes', 'actualizar')
  retirar(
    @Param('id') id: string,
    @Body() dto: RetirarIntegranteDto,
    @Req() request: { user: Usuario },
  ) {
    return this.integrantesService.retirarDeExpediente(
      id,
      dto,
      accessScopeFromUser(request.user),
    );
  }

  @Patch(':id/reintegrar')
  @RequierePermiso('expedientes', 'actualizar')
  reintegrar(
    @Param('id') id: string,
    @Req() request: { user: Usuario },
  ) {
    return this.integrantesService.reintegrarEnExpediente(
      id,
      accessScopeFromUser(request.user),
    );
  }

  @Patch(':id')
  @RequierePermiso('expedientes', 'actualizar')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateIntegranteDto,
    @Req() request: { user: Usuario },
  ) {
    return this.integrantesService.update(id, dto, accessScopeFromUser(request.user));
  }
}
