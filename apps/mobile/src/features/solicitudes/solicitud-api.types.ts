export interface IntegranteApiResponse {
  id: string;
  nombres?: string;
  apellido_pat?: string;
  apellido_mat?: string;
  telefono?: string;
  telefonoSecundario?: string;
  montoSolicitado?: number | null;
  montoProspectivo?: number | null;
  montoAutorizadoAnterior?: number | null;
  comparacionMontoDisponible?: boolean;
  esRenovacion?: boolean;
  montoReferenciaPaso6?: number | null;
  origenMontoReferenciaPaso6?: 'CICLO_ANTERIOR' | 'PROSPECCION';
  montoMaximoSolicitable?: number;
}

export interface SolicitudApiResponse {
  monto_solicitado?: number | null;
  monto_solicitado_confirmado_at?: string | null;
  nombres?: string;
  fecha_nac?: string;
  curp?: string;
  nacionalidad?: string;
  estado_nacimiento?: string;
  genero?: string;
  estado_civil?: string;
  ocupacion?: string;
  nivel_estudio?: string;
  telefono?: string;
  dom_calle?: string;
  dom_num_ext?: string;
  dom_num_int?: string;
  dom_colonia?: string;
  dom_municipio?: string;
  dom_estado?: string;
  dom_codigo_postal?: string;
  dom_entre_calles?: string;
  dom_latitud?: number | null;
  dom_longitud?: number | null;
  dom_geocodificacion_fuente?: string | null;
  dom_geocodificacion_fecha?: string | null;
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
  negocio_domicilio?: string;
  negocio_num_ext?: string;
  negocio_num_int?: string;
  negocio_colonia?: string;
  negocio_municipio?: string;
  negocio_estado?: string;
  negocio_codigo_postal?: string;
  negocio_desde_cuando?: string;
  negocio_ingreso_semanal?: number;
  negocio_otros_ingresos?: number;
  negocio_gastos?: number;
  negocio_total?: number;
  negocio_giro?: string;
  beneficiario_nombre?: string;
  beneficiario_parentesco?: string;
  beneficiario_telefono?: string;
  beneficiario_direccion?: string;
  tiene_medidor_luz?: string;
  vive_max_5km_tesorera?: string;
  tiene_menos_70_anios?: string;
  doc_ine_ruta?: string;
  doc_comprobante_ruta?: string;
  doc_ine_beneficiario_ruta?: string;
  doc_solicitud_firmada_ruta?: string;
  doc_comprobante_credito_ruta?: string;
}

export interface CodigoPostalApiResponse {
  colonias: string[];
  municipio: string;
}
