import {
  IsUUID,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsBoolean,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * DTO para crear/actualizar solicitudes
 *
 * ARQUITECTURA: cada campo coincide EXACTAMENTE con el nombre de columna en PostgreSQL.
 * Las 8 tablas (solicitudes + 7 hijas) están representadas aquí con sus prefijos originales.
 *
 * CAMPOS CORE REQUERIDOS (solicitudes):
 * - integrante_id, persona_id, expediente_id, grupo_id
 *
 * CAMPOS QUE NUNCA VIENEN DEL FRONTEND:
 * - numero_credito, credito_id (asignados en desembolso)
 *
 * TABLAS HIJAS (todos opcionales porque el wizard guarda por pasos):
 * - solicitudes_datos_personales: 17 cols
 * - solicitudes_domicilios: 14 cols
 * - solicitudes_negocios: 18 cols
 * - solicitudes_referencias: 15 cols
 * - solicitudes_beneficiarios: 8 cols
 * - solicitudes_validaciones: 7 cols
 * - solicitudes_documentos: 12 cols
 */
export class CreateSolicitudDto {
  // ====================================================================
  // TABLA: solicitudes (CORE) - 14 columnas
  // ====================================================================

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

  @IsOptional()
  @IsNumber()
  @Min(0)
  monto_solicitado?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monto_autorizado?: number;

  // ====================================================================
  // TABLA: solicitudes_datos_personales - 17 columnas
  // ====================================================================

  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombres?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  apellido_pat?: string;

  // Legacy: separación errónea de nombres compuestos
  @IsOptional()
  @IsString()
  @MaxLength(50)
  primer_nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  segundo_nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  apellido_mat?: string;

  @IsOptional()
  @IsString()
  @MaxLength(18)
  curp?: string;

  @IsOptional()
  @IsDateString()
  fecha_nac?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  genero?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nacionalidad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  estado_nacimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  estado_civil?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ocupacion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nivel_estudio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  // ====================================================================
  // TABLA: solicitudes_domicilios - 14 columnas
  // ====================================================================

  @IsOptional()
  @IsString()
  @MaxLength(150)
  dom_calle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  dom_num_ext?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  dom_num_int?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  dom_entre_calles?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  dom_colonia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  dom_municipio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  dom_estado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  dom_codigo_postal?: string;

  @IsOptional()
  @IsUUID('4')
  dom_cp_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  dom_telefono?: string;

  // ====================================================================
  // TABLA: solicitudes_negocios - 18 columnas
  // ====================================================================

  @IsOptional()
  @IsString()
  @MaxLength(100)
  negocio_giro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  negocio_domicilio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  negocio_colonia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  negocio_municipio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  negocio_estado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  negocio_codigo_postal?: string;

  @IsOptional()
  @IsUUID('4')
  negocio_cp_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  negocio_num_ext?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  negocio_num_int?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  negocio_desde_cuando?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  negocio_ingreso_semanal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  negocio_otros_ingresos?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  negocio_gastos?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  negocio_total?: number;

  // ====================================================================
  // TABLA: solicitudes_referencias - 15 columnas
  // ====================================================================

  @IsOptional()
  @IsString()
  @MaxLength(150)
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
  ref1_direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  ref2_nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ref2_parentesco?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ref2_telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  ref2_direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  pareja_nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  pareja_actividad?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pareja_ingreso_semanal?: number;

  // ====================================================================
  // TABLA: solicitudes_beneficiarios - 8 columnas
  // ====================================================================

  @IsOptional()
  @IsString()
  @MaxLength(150)
  beneficiario_nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  beneficiario_parentesco?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  beneficiario_telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  beneficiario_direccion?: string;

  // ====================================================================
  // TABLA: solicitudes_validaciones - 7 columnas
  // ====================================================================

  @IsOptional()
  @IsString()
  @MaxLength(20)
  tiene_medidor_luz?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  vive_max_5km_tesorera?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  tiene_menos_70_anios?: string;

  // ====================================================================
  // TABLA: solicitudes_documentos - 12 columnas
  // ====================================================================

  @IsOptional()
  @IsString()
  @MaxLength(500)
  doc_ine_ruta?: string;

  @IsOptional()
  @IsDateString()
  doc_ine_fecha?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  doc_comprobante_ruta?: string;

  @IsOptional()
  @IsDateString()
  doc_comprobante_fecha?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  doc_ine_beneficiario_ruta?: string;

  @IsOptional()
  @IsDateString()
  doc_ine_beneficiario_fecha?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  doc_solicitud_firmada_ruta?: string;

  @IsOptional()
  @IsDateString()
  doc_solicitud_firmada_fecha?: string;
}
