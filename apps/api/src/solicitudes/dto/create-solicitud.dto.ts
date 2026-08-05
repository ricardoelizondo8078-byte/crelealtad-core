import { IsUUID, IsOptional, IsString, IsNumber, IsBoolean, MaxLength, Min } from 'class-validator';

/**
 * DTO para crear/actualizar solicitudes
 *
 * CRÍTICO: NO usar firma de índice [key: string].
 * Cada campo debe estar explícitamente declarado con su validador.
 *
 * Campos que NUNCA deben venir del frontend:
 * - numero_credito (asignado en desembolso)
 * - credito_id (asignado en desembolso)
 */
export class CreateSolicitudDto {
  // ===== IDENTIFICADORES (CORE - REQUERIDOS) =====

  @IsUUID('4', { message: 'integrante_id debe ser un UUID válido' })
  integrante_id: string;

  @IsUUID('4', { message: 'persona_id debe ser un UUID válido' })
  persona_id: string;

  @IsUUID('4', { message: 'expediente_id debe ser un UUID válido' })
  expediente_id: string;

  @IsUUID('4', { message: 'grupo_id debe ser un UUID válido' })
  grupo_id: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  folio?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  ciclo_numero?: number;

  // ===== MONTOS =====

  @IsOptional()
  @IsNumber()
  @Min(0)
  monto_solicitado?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monto_autorizado?: number;

  // ===== DATOS PERSONALES =====

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombres?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  apellido_pat?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  apellido_mat?: string;

  @IsOptional()
  @IsString()
  @MaxLength(18)
  curp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(13)
  rfc?: string;

  @IsOptional()
  @IsString()
  fecha_nacimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  estado_civil?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dependientes_economicos?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  escolaridad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  // ===== DOMICILIO =====

  @IsOptional()
  @IsString()
  @MaxLength(200)
  calle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  numero_ext?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  numero_int?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  colonia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  municipio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  estado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  codigo_postal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tipo_vivienda?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  años_residencia?: number;

  // ===== NEGOCIO =====

  @IsOptional()
  @IsString()
  @MaxLength(200)
  negocio_nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  negocio_giro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  negocio_calle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  negocio_numero_ext?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  negocio_colonia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  negocio_municipio?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  negocio_años_operacion?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  negocio_tipo_local?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  negocio_monto_renta?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  negocio_ingresos_mensuales?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  negocio_gastos_mensuales?: number;

  // ===== REFERENCIAS =====

  @IsOptional()
  @IsString()
  @MaxLength(200)
  ref1_nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ref1_parentesco?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ref1_telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  ref2_nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ref2_parentesco?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ref2_telefono?: string;

  // ===== BENEFICIARIO =====

  @IsOptional()
  @IsString()
  @MaxLength(200)
  beneficiario_nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  beneficiario_parentesco?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  beneficiario_telefono?: string;

  // ===== VALIDACIONES =====

  @IsOptional()
  @IsBoolean()
  validacion_identidad?: boolean;

  @IsOptional()
  @IsBoolean()
  validacion_domicilio?: boolean;

  @IsOptional()
  @IsBoolean()
  validacion_negocio?: boolean;

  @IsOptional()
  @IsBoolean()
  validacion_referencias?: boolean;

  @IsOptional()
  @IsBoolean()
  validacion_buro?: boolean;

  @IsOptional()
  @IsString()
  validacion_observaciones?: string;

  // ===== DOCUMENTOS =====

  @IsOptional()
  @IsString()
  documento_ine_url?: string;

  @IsOptional()
  @IsString()
  documento_curp_url?: string;

  @IsOptional()
  @IsString()
  documento_comprobante_domicilio_url?: string;

  @IsOptional()
  @IsString()
  documento_estado_cuenta_url?: string;

  @IsOptional()
  @IsBoolean()
  documentos_completos?: boolean;
}
