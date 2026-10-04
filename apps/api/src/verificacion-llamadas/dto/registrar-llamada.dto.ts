import { Type } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { TipoTelefonoEntrevista } from '../verificacion-entrevista-telefono-confirmacion.entity';
import {
  CanalLlamadaVerificacion,
  ResultadoLlamadaVerificacion,
} from '../verificacion-llamada.entity';

export class RegistrarLlamadaVerificacionDto {
  @IsEnum(CanalLlamadaVerificacion)
  canal: CanalLlamadaVerificacion;

  @IsEnum(ResultadoLlamadaVerificacion)
  resultado: ResultadoLlamadaVerificacion;

  @ValidateIf((value: RegistrarLlamadaVerificacionDto) => value.telefono !== undefined)
  @IsEnum(TipoTelefonoEntrevista)
  tipo_telefono?: TipoTelefonoEntrevista;

  @ValidateIf((value: RegistrarLlamadaVerificacionDto) => value.tipo_telefono !== undefined)
  @Matches(/^[0-9]{10}$/)
  telefono?: string;

  @IsString()
  @Length(16, 100)
  @Matches(/^[A-Za-z0-9:_-]+$/)
  idempotency_key: string;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  ubicacion_latitud: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  ubicacion_longitud: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ubicacion_precision_metros?: number;

  @IsISO8601({ strict: true })
  ubicacion_capturada_at: string;
}
