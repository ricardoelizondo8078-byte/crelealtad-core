export type SelectValue = string;

export type SelectorFieldKey =
  | 'nacionalidad'
  | 'estado_nacimiento'
  | 'genero'
  | 'estado_civil'
  | 'nivel_estudio'
  | 'colonia'
  | 'municipio'
  | 'negocio_colonia'
  | 'negocio_municipio'
  | 'negocioDesdeCuando'
  | 'referencia1Parentesco'
  | 'referencia2Parentesco'
  | 'beneficiario_parentesco'
  | 'tieneMedidorLuzSinAdeudo'
  | 'viveMaximo5KmTesorera'
  | 'tiene_menos_70_anios';

export interface SolicitudFormData {
  // Paso 1: Información Personal
  primer_nombre?: string;
  segundo_nombre?: string;
  apellido_pat?: string;
  apellido_mat?: string;
  curp?: string;
  fecha_nac?: string;
  nacionalidad?: string;
  estado_nacimiento?: string;
  genero?: string;
  estado_civil?: string;
  ocupacion?: string;
  nivel_estudio?: string;
  telefono?: string;

  // Paso 2: Domicilio
  dom_calle?: string;
  dom_num_ext?: string;
  dom_num_int?: string;
  dom_entre_calles?: string;
  dom_codigo_postal?: string;
  dom_colonia?: string;
  dom_municipio?: string;
  dom_estado?: string;
  dom_telefono?: string;

  // Paso 3: Referencias
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
  pareja_ingreso_semanal?: string;

  // Paso 4: Negocio
  negocio_giro?: string;
  negocio_domicilio?: string;
  negocio_codigo_postal?: string;
  negocio_colonia?: string;
  negocio_municipio?: string;
  negocio_estado?: string;
  negocio_desde_cuando?: string;
  negocio_ingreso_semanal?: string;
  negocio_otros_ingresos?: string;
  negocio_gastos?: string;

  // Paso 5: Beneficiario
  beneficiario_nombre?: string;
  beneficiario_parentesco?: string;
  beneficiario_telefono?: string;
  beneficiario_direccion?: string;

  // Paso 6: Validaciones
  tiene_medidor_luz?: string;
  vive_max_5km_tesorera?: string;
  monto_solicitado?: string;

  // Paso 7: Documentos
  doc_ine_ruta?: string;
  doc_comprobante_ruta?: string;
  doc_ine_beneficiario_ruta?: string;
  doc_solicitud_firmada_ruta?: string;
}

export interface SolicitudErrors {
  [key: string]: string | undefined;
}

export type DocumentStatus = 'PENDIENTE' | 'CARGADO' | 'OPCIONAL';

export interface DocumentoRequerido {
  id: string;
  nombre: string;
  obligatorio: boolean;
  status: DocumentStatus;
  uriFrente?: string;
  uriReverso?: string;
}

export interface WizardStep {
  id: number;
  title: string;
  shortTitle: string;
}
