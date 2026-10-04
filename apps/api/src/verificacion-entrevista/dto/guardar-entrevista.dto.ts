import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

const COMO_CONOCIO_ASESORA = [
  'OTRA_INTEGRANTE',
  'OTRA_FINANCIERA',
  'FACEBOOK',
  'OTRO',
] as const;
const ANTIGUEDAD_DOMICILIO = ['0_A_1', '1_A_3', 'MAS_DE_3'] as const;
const TIPO_DOMICILIO = ['RENTA', 'PROPIA', 'FAMILIAR'] as const;
const FAMILIAR_DOMICILIO = ['PAPAS', 'HIJOS', 'ABUELOS', 'OTRO_FAMILIAR'] as const;
const PERSONAS_VIVEN_CASA = ['1', '2', '3', '4', '5', '6_O_MAS'] as const;
const CONVIVIENTES = ['CONYUGE', 'HIJOS', 'PADRES', 'HERMANOS', 'OTROS'] as const;
const FUENTES_INGRESO = ['SUELDO', 'NEGOCIO'] as const;
const ANTIGUEDAD_LABORAL = ['1_ANIO', '2_ANIOS', '3_A_5_ANIOS', '5_O_MAS'] as const;
const FRECUENCIA = ['SIEMPRE', 'A_VECES', 'NUNCA'] as const;
const CALIFICACION = ['EXCELENTE', 'BUENO', 'REGULAR', 'MALO'] as const;
const RAPIDEZ = ['MUY_RAPIDO', 'RAPIDO', 'LENTO', 'MUY_LENTO'] as const;

export class DesacuerdoMontoEntrevistaDto {
  @IsUUID()
  integrante_id: string;

  @IsString()
  @MaxLength(120)
  motivo: string;
}

export class GuardarEntrevistaDto {
  @IsOptional()
  @IsBoolean()
  conoce_asesora?: boolean | null;

  @IsOptional()
  @IsIn(COMO_CONOCIO_ASESORA)
  como_conocio_asesora?: string | null;

  @IsOptional()
  @IsBoolean()
  conoce_integrantes?: boolean | null;

  @IsOptional()
  @IsIn(ANTIGUEDAD_DOMICILIO)
  tiempo_conoce_integrantes?: string | null;

  @IsOptional()
  @IsBoolean()
  sabe_montos_companeras?: boolean | null;

  @IsOptional()
  @IsBoolean()
  acuerdo_montos_companeras?: boolean | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique((item: DesacuerdoMontoEntrevistaDto) => item.integrante_id)
  @ValidateNested({ each: true })
  @Type(() => DesacuerdoMontoEntrevistaDto)
  desacuerdos_montos?: DesacuerdoMontoEntrevistaDto[];

  @IsOptional()
  @IsBoolean()
  conoce_tesorera?: boolean | null;

  @IsOptional()
  @IsUUID()
  tesorera_reconocida_integrante_id?: string | null;

  @IsOptional()
  @IsUUID()
  domicilio_recoleccion_integrante_id?: string | null;

  @IsOptional()
  @IsBoolean()
  desconoce_domicilio_recoleccion?: boolean | null;

  @IsOptional()
  @IsBoolean()
  tiene_familiares_grupo?: boolean | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  familiares_grupo_ids?: string[];

  @IsOptional()
  @IsBoolean()
  tiene_otro_credito_grupal?: boolean | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  financiera_credito_grupal?: string | null;

  @IsOptional()
  @IsBoolean()
  credito_grupal_anterior_activo?: boolean | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valor_ficha_credito_grupal?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(16)
  semana_actual_credito_grupal?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes_desembolso_credito_grupal?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes_ultimo_pago_credito_grupal?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2200)
  anio_ultimo_pago_credito_grupal?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(40)
  numero_ciclos_credito_grupal?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(65)
  @Max(100)
  tasa_credito_grupal?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombre_asesora_credito_grupal?: string | null;

  @IsOptional()
  @Matches(/^[0-9]{10}$/)
  telefono_asesora_credito_grupal?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  motivo_no_renovacion_credito_grupal?: string | null;

  @IsOptional()
  @IsBoolean()
  vive_en_domicilio?: boolean | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  motivo_no_vive_domicilio?: string | null;

  @IsOptional()
  @IsIn(TIPO_DOMICILIO)
  tipo_domicilio?: string | null;

  @IsOptional()
  @IsIn(FAMILIAR_DOMICILIO)
  familiar_domicilio?: string | null;

  @IsOptional()
  @IsIn(ANTIGUEDAD_DOMICILIO)
  antiguedad_domicilio?: string | null;

  @IsOptional()
  @IsIn(PERSONAS_VIVEN_CASA)
  personas_viven_casa?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(CONVIVIENTES, { each: true })
  convivientes?: string[];

  @IsOptional()
  @IsBoolean()
  saben_del_credito?: boolean | null;

  @IsOptional()
  @IsBoolean()
  otro_ingreso_hogar?: boolean | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  otro_ingreso_semanal?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  capacidad_pago_semanal?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  uso_credito?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(FUENTES_INGRESO, { each: true })
  fuentes_ingreso?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sueldo_semanal?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  lugar_trabajo?: string | null;

  @IsOptional()
  @IsIn(ANTIGUEDAD_LABORAL)
  antiguedad_laboral?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  tipo_negocio?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  ingreso_libre_semanal_negocio?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  ubicacion_negocio?: string | null;

  @IsOptional()
  @IsBoolean()
  tiene_control_pagos?: boolean | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  motivo_sin_control_pagos?: string | null;

  @IsOptional()
  @IsIn(FRECUENCIA)
  asesora_acudio_semanalmente?: string | null;

  @IsOptional()
  @IsIn(FRECUENCIA)
  firmaban_control_semanalmente?: string | null;

  @IsOptional()
  @IsIn(CALIFICACION)
  trato_asesora_tesorera?: string | null;

  @IsOptional()
  @IsBoolean()
  conoce_premio_tesorera?: boolean | null;

  @IsOptional()
  @IsIn(CALIFICACION)
  opinion_credito?: string | null;

  @IsOptional()
  @IsIn(CALIFICACION)
  trato_desembolso?: string | null;

  @IsOptional()
  @IsIn(RAPIDEZ)
  rapidez_desembolso?: string | null;

  @IsOptional()
  @IsBoolean()
  informacion_credito_clara?: boolean | null;

  @IsOptional()
  @IsBoolean()
  recomendaria?: boolean | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  motivo_recomendacion?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  oportunidad_mejora?: string | null;
}
