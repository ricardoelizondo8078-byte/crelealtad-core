import { Entity, ViewColumn, ViewEntity } from 'typeorm';

/**
 * Entity de LECTURA sobre la vista solicitudes_completo
 * NO usar para INSERT/UPDATE - usar SolicitudCoreEntity + tablas hijas
 */
@ViewEntity({ name: 'solicitudes_completo' })
export class SolicitudReadEntity {
  @ViewColumn()
  id: string;

  @ViewColumn()
  folio: string;

  @ViewColumn()
  monto_solicitado: number;

  @ViewColumn()
  integrante_id: string;

  @ViewColumn()
  persona_id: string;

  @ViewColumn()
  expediente_id: string;

  @ViewColumn()
  grupo_id: string;

  @ViewColumn()
  ciclo_numero: number;

  @ViewColumn()
  numero_credito: number;

  @ViewColumn()
  credito_id: string;

  // Datos personales
  @ViewColumn()
  nombres: string;

  @ViewColumn()
  apellido_pat: string;

  @ViewColumn()
  apellido_mat: string;

  @ViewColumn()
  nombre_completo: string;

  @ViewColumn()
  curp: string;

  @ViewColumn()
  fecha_nac: Date;

  @ViewColumn()
  genero: string;

  @ViewColumn()
  nacionalidad: string;

  @ViewColumn()
  estado_nacimiento: string;

  @ViewColumn()
  estado_civil: string;

  @ViewColumn()
  ocupacion: string;

  @ViewColumn()
  nivel_estudio: string;

  // Domicilio
  @ViewColumn()
  dom_calle: string;

  @ViewColumn()
  dom_num_ext: string;

  @ViewColumn()
  dom_num_int: string;

  @ViewColumn()
  dom_entre_calles: string;

  @ViewColumn()
  dom_codigo_postal: string;

  @ViewColumn()
  dom_colonia: string;

  @ViewColumn()
  dom_municipio: string;

  @ViewColumn()
  dom_estado: string;

  @ViewColumn()
  dom_telefono: string;

  // Referencias
  @ViewColumn()
  ref1_nombre: string;

  @ViewColumn()
  ref1_parentesco: string;

  @ViewColumn()
  ref1_telefono: string;

  @ViewColumn()
  ref1_direccion: string;

  @ViewColumn()
  ref2_nombre: string;

  @ViewColumn()
  ref2_parentesco: string;

  @ViewColumn()
  ref2_telefono: string;

  @ViewColumn()
  ref2_direccion: string;

  @ViewColumn()
  pareja_nombre: string;

  @ViewColumn()
  pareja_actividad: string;

  @ViewColumn()
  pareja_ingreso_semanal: number;

  // Negocio
  @ViewColumn()
  negocio_domicilio: string;

  @ViewColumn()
  negocio_num_ext: string;

  @ViewColumn()
  negocio_num_int: string;

  @ViewColumn()
  negocio_estado: string;

  @ViewColumn()
  negocio_codigo_postal: string;

  @ViewColumn()
  negocio_colonia: string;

  @ViewColumn()
  negocio_municipio: string;

  @ViewColumn()
  negocio_desde_cuando: string;

  @ViewColumn()
  negocio_giro: string;

  @ViewColumn()
  negocio_ingreso_semanal: number;

  @ViewColumn()
  negocio_otros_ingresos: number;

  @ViewColumn()
  negocio_gastos: number;

  @ViewColumn()
  negocio_total: number;

  // Beneficiario
  @ViewColumn()
  beneficiario_nombre: string;

  @ViewColumn()
  beneficiario_parentesco: string;

  @ViewColumn()
  beneficiario_telefono: string;

  @ViewColumn()
  beneficiario_direccion: string;

  // Validaciones
  @ViewColumn()
  tiene_medidor_luz: string;

  @ViewColumn()
  vive_max_5km_tesorera: string;

  @ViewColumn()
  tiene_menos_70_anios: string;

  // Documentos
  @ViewColumn()
  doc_ine_ruta: string;

  @ViewColumn()
  doc_ine_fecha: Date;

  @ViewColumn()
  doc_comprobante_ruta: string;

  @ViewColumn()
  doc_comprobante_fecha: Date;

  @ViewColumn()
  doc_ine_beneficiario_ruta: string;

  @ViewColumn()
  doc_ine_beneficiario_fecha: Date;

  @ViewColumn()
  doc_solicitud_firmada_ruta: string;

  @ViewColumn()
  doc_solicitud_firmada_fecha: Date;

  @ViewColumn()
  doc_comprobante_credito_ruta: string;

  @ViewColumn()
  doc_comprobante_credito_fecha: Date;

  // Montos
  @ViewColumn()
  monto_autorizado: number;

  @ViewColumn()
  created_at: Date;

  @ViewColumn()
  updated_at: Date;
}
