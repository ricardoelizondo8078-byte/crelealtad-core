import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  CLASIFICACIONES_SEMAFORO_EVIDENCIA,
  ClasificacionSemaforoEvidencia,
  FUENTES_EVIDENCIA_ENTREVISTA,
  FuenteEvidenciaEntrevista,
  TIPOS_EVIDENCIA_ENTREVISTA,
  TipoEvidenciaEntrevista,
} from '../verificacion-entrevista-evidencia.entity';

const transformarIntegrantes = ({ value }: { value: unknown }): unknown => {
  if (Array.isArray(value) || typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return [value];
  }
};

export class RegistrarEvidenciaEntrevistaDto {
  @IsIn(TIPOS_EVIDENCIA_ENTREVISTA)
  tipo: TipoEvidenciaEntrevista;

  @IsString()
  @Length(16, 100)
  @Matches(/^[A-Za-z0-9:_-]+$/)
  idempotency_key: string;

  @IsOptional()
  @IsIn(FUENTES_EVIDENCIA_ENTREVISTA)
  captura_fuente?: FuenteEvidenciaEntrevista;

  @IsOptional()
  @Transform(transformarIntegrantes)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  integrante_ids?: string[];

  @IsOptional()
  @IsIn(CLASIFICACIONES_SEMAFORO_EVIDENCIA)
  clasificacion_semaforo?: ClasificacionSemaforoEvidencia;

  @IsOptional()
  @IsUUID('4')
  motivo_clasificacion_id?: string;

  @ValidateIf((input: RegistrarEvidenciaEntrevistaDto, value: unknown) => (
    input.captura_fuente !== 'GALERIA' || value != null
  ))
  @IsISO8601({ strict: true })
  foto_capturada_at?: string;

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
