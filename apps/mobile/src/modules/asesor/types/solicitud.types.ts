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
  primerNombre?: string;
  segundoNombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  curp?: string;
  fechaNacimiento?: string;
  nacionalidad?: string;
  estadoNacimiento?: string;
  genero?: string;
  estadoCivil?: string;
  ocupacion?: string;
  nivelEstudio?: string;
  telefono?: string;

  // Paso 2: Domicilio
  domCalle?: string;
  domNumExt?: string;
  domNumInt?: string;
  domEntreCalles?: string;
  domCodigoPostal?: string;
  domColonia?: string;
  domMunicipio?: string;
  domEstado?: string;
  domTelefono?: string;

  // Paso 3: Referencias
  referencia1Nombre?: string;
  referencia1Parentesco?: string;
  referencia1Telefono?: string;
  referencia1Direccion?: string;
  referencia2Nombre?: string;
  referencia2Parentesco?: string;
  referencia2Telefono?: string;
  referencia2Direccion?: string;
  parejaNombre?: string;
  parejaActividad?: string;
  parejaIngresoSemanal?: string;

  // Paso 4: Negocio
  negocioGiro?: string;
  negocioDomicilio?: string;
  negocioCodigoPostal?: string;
  negocioColonia?: string;
  negocioMunicipio?: string;
  negocioEstado?: string;
  negocioDesdeCuando?: string;
  negocioIngresoSemanal?: string;
  negocioOtrosIngresos?: string;
  negocioGastos?: string;

  // Paso 5: Beneficiario
  beneficiarioNombre?: string;
  beneficiarioParentesco?: string;
  beneficiarioTelefono?: string;
  beneficiarioDireccion?: string;

  // Paso 6: Validaciones
  tieneMedidorLuzSinAdeudo?: string;
  viveMaximo5KmTesorera?: string;
  tieneMenos70Anios?: string;
  montoSolicitado?: string;
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
