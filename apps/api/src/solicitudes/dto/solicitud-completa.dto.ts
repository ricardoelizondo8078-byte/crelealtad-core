/**
 * DTO de respuesta para GET que incluye core + 7 tablas hijas.
 * Resuelve colisiones: solo id, created_at, updated_at del core sobreviven.
 * solicitud_id de las hijas se excluye.
 */
export interface SolicitudCompletaDto {
  // Core (13 columnas)
  id: string;
  folio: string;
  integrante_id: string;
  persona_id: string;
  expediente_id: string;
  grupo_id: string;
  credito_id: string | null;
  ciclo_numero: number | null;
  numero_credito: number | null;
  monto_solicitado: number | null;
  monto_autorizado: number | null;
  created_at: Date;
  updated_at: Date;

  // Datos personales (15 columnas - excluye id, solicitud_id, created_at, updated_at)
  nombres?: string;
  apellido_pat?: string;
  apellido_mat?: string;
  nombre_completo?: string;
  curp?: string;
  fecha_nac?: Date;
  genero?: string;
  nacionalidad?: string;
  estado_nacimiento?: string;
  estado_civil?: string;
  ocupacion?: string;
  nivel_estudio?: string;
  telefono?: string;
  // Legacy: separación errónea de nombres compuestos
  primer_nombre?: string;
  segundo_nombre?: string;

  // Domicilios (10 columnas - excluye id, solicitud_id, created_at, updated_at)
  dom_calle?: string;
  dom_num_ext?: string;
  dom_num_int?: string;
  dom_entre_calles?: string;
  dom_colonia?: string;
  dom_municipio?: string;
  dom_estado?: string;
  dom_codigo_postal?: string;
  dom_cp_id?: string;
  dom_telefono?: string;

  // Negocios (14 columnas - excluye id, solicitud_id, created_at, updated_at)
  negocio_giro?: string;
  negocio_domicilio?: string;
  negocio_colonia?: string;
  negocio_municipio?: string;
  negocio_estado?: string;
  negocio_codigo_postal?: string;
  negocio_cp_id?: string;
  negocio_num_ext?: string;
  negocio_num_int?: string;
  negocio_desde_cuando?: string;
  negocio_ingreso_semanal?: number;
  negocio_otros_ingresos?: number;
  negocio_gastos?: number;
  negocio_total?: number;

  // Referencias (11 columnas - excluye id, solicitud_id, created_at, updated_at)
  ref1_nombre?: string;
  ref1_parentesco?: string;
  ref1_telefono?: string;
  ref1_direccion?: string;
  ref2_nombre?: string;
  ref2_parentesco?: string;
  ref2_telefono?: string;
  ref2_direccion?: string;
  pareja_nombre?: string;
  pareja_actividad?: string;
  pareja_ingreso_semanal?: number;

  // Beneficiarios (4 columnas - excluye id, solicitud_id, created_at, updated_at)
  beneficiario_nombre?: string;
  beneficiario_parentesco?: string;
  beneficiario_telefono?: string;
  beneficiario_direccion?: string;

  // Validaciones (3 columnas - excluye id, solicitud_id, created_at, updated_at)
  tiene_medidor_luz?: string;
  vive_max_5km_tesorera?: string;
  tiene_menos_70_anios?: string;

  // Documentos (10 columnas - excluye id, solicitud_id, created_at, updated_at)
  doc_ine_ruta?: string;
  doc_ine_fecha?: Date;
  doc_comprobante_ruta?: string;
  doc_comprobante_fecha?: Date;
  doc_ine_beneficiario_ruta?: string;
  doc_ine_beneficiario_fecha?: Date;
  doc_solicitud_firmada_ruta?: string;
  doc_solicitud_firmada_fecha?: Date;
  doc_comprobante_credito_ruta?: string;
  doc_comprobante_credito_fecha?: Date;
}
