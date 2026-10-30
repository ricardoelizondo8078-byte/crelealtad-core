import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ClasificacionFinancieraCompetidora {
  OBJETIVO = 'OBJETIVO',
  REVISION = 'REVISION',
  NO_PRIORITARIA = 'NO_PRIORITARIA',
}

export class SucursalFinancieraCompetidoraDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  zona?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  direccion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000000)
  numero_asesoras?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  valor_sucursal?: string;
}

export class PublicarCambioFinancieraDto {
  @IsOptional()
  @IsUUID()
  financiera_id?: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  nombre?: string;

  @IsOptional()
  @IsEnum(ClasificacionFinancieraCompetidora)
  clasificacion?: ClasificacionFinancieraCompetidora | null;

  @IsOptional()
  @IsString()
  @Length(5, 500)
  motivo?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  aliases?: string[];

  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  semanas?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  tasa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  seguro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  apertura?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  retencion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  base?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  refinanciamiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  descripcion?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => SucursalFinancieraCompetidoraDto)
  sucursales?: SucursalFinancieraCompetidoraDto[];

  @IsOptional()
  @IsDateString({ strict: true })
  vigencia_desde?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000)
  expected_revision?: number;
}
