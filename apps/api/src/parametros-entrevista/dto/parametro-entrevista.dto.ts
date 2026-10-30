import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { FAMILIAS_PARAMETROS_ENTREVISTA } from '../parametros-entrevista.types';

export class ListarParametrosEntrevistaDto {
  @IsOptional()
  @IsIn(FAMILIAS_PARAMETROS_ENTREVISTA)
  familia?: (typeof FAMILIAS_PARAMETROS_ENTREVISTA)[number];

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  incluir_inactivos?: boolean;
}

export class CrearParametroEntrevistaDto {
  @IsIn(FAMILIAS_PARAMETROS_ENTREVISTA)
  familia: (typeof FAMILIAS_PARAMETROS_ENTREVISTA)[number];

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  etiqueta: string;
}

export class ActualizarParametroEntrevistaDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  etiqueta: string;
}

export class CambiarEstadoParametroEntrevistaDto {
  @IsBoolean()
  activo: boolean;
}

export class ReordenarParametrosEntrevistaDto {
  @IsIn(FAMILIAS_PARAMETROS_ENTREVISTA)
  familia: (typeof FAMILIAS_PARAMETROS_ENTREVISTA)[number];

  @IsArray()
  @IsUUID('4', { each: true })
  opcion_ids: string[];
}
