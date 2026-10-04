import type {
  CreditHistoryCycle,
  CreditHistoryExtreme,
} from '../../components/ui';
import type {
  ImagenDomicilioPendiente,
  TipoImagenDomicilio,
} from './verificacion-imagenes-domicilio.api';
import type {
  EvidenciaEntrevistaPendiente,
  TipoEvidenciaEntrevista,
} from './verificacion-entrevista.api';

export interface IntegranteData {
  id: string;
  nombre: string;
  telefono: string;
  telefonoSecundario?: string | null;
  montoSolicitado: number | null;
  montoAutorizadoAnterior: number | null;
  esTesorera: boolean;
  cicloNumeroActual: number | null;
  esRenovacion: boolean;
  esNuevaConNosotros: boolean;
  tieneHistorialInterno: boolean | null;
  creditosParticipados: number | null;
  historialCrediticioInterno: {
    totalCycles: number;
    maximum: CreditHistoryExtreme;
    minimum: CreditHistoryExtreme;
    recentCycles: CreditHistoryCycle[];
  } | null;
  edad: number | null;
  superaLimiteEdad: boolean;
  distanciaTesoreraAproxKm: number | null;
}

export interface TelefonoLlamadaDisponible {
  tipo: 'PRINCIPAL' | 'SECUNDARIO';
  etiqueta: 'Principal' | 'Secundario';
  numero: string;
}

export interface SolicitudData {
  nombres: string;
  apellido_pat: string;
  apellido_mat?: string;
  nombre_completo?: string;
  dom_calle?: string;
  dom_num_ext?: string;
  dom_num_int?: string;
  dom_colonia?: string;
  dom_municipio?: string;
  dom_codigo_postal?: string;
}

export const TIPOS_DOCUMENTO_REVISION = [
  'ine',
  'comprobante',
  'solicitud_firmada',
] as const;

export type TipoDocumentoRevision = (typeof TIPOS_DOCUMENTO_REVISION)[number];

export type TipoDocumentoConsulta =
  | TipoDocumentoRevision
  | 'ine_beneficiario'
  | 'comprobante_credito';

export interface DocumentoItem {
  clave: string;
  tipo: TipoDocumentoConsulta;
  obligatorioRevision: boolean;
  nombre: string;
  icono: string;
  ruta?: string;
  estado: 'Capturado' | 'Pendiente';
  uriFrente?: string;
  uriReverso?: string;
  headers?: Record<string, string>;
  validacion?: 'si' | 'no' | null;
}

export interface DocumentoFuente {
  clave: string;
  tipo: TipoDocumentoConsulta;
  obligatorioRevision: boolean;
  nombre: string;
  icono: string;
  rutaDB?: string;
}

export interface DocumentoRemoto {
  archivos: Array<{ indice?: number; mime_type: string; url: string }>;
}

export type PasoVerificacion =
  | 'documentos'
  | 'menu'
  | 'llamada-integrante'
  | 'visita-vecino'
  | 'foto-domicilio'
  | 'localizacion'
  | 'evaluacion-economica'
  | 'referencias'
  | 'preguntas-generales'
  | 'preguntas-tesorera'
  | 'control-pagos'
  | 'autoevaluacion'
  | 'validacion-integrante'
  | 'observaciones'
  | 'decision';

export type VistaLlamada = 'acciones' | 'encuesta';
export type TipoTelefonoEntrevista = 'PRINCIPAL' | 'SECUNDARIO';

export type TipoImagenDomicilioEnPantalla = Exclude<
  TipoImagenDomicilio,
  'NOMENCLATURAS_CALLES'
>;

export type ImagenDomicilioPendienteEnPantalla = Omit<ImagenDomicilioPendiente, 'tipo'> & {
  tipo: TipoImagenDomicilioEnPantalla;
};

export interface ImagenDomicilioVista {
  id: string;
  uri: string;
  headers?: Record<string, string>;
  fotoCapturadaAt: string;
}

export interface EvidenciaNegocioVista {
  id: string;
  uri: string;
  headers?: Record<string, string>;
  registradaAt: string;
}

export type TipoEvidenciaHistorialCredito = Extract<
  TipoEvidenciaEntrevista,
  'HISTORIAL_CREDITO_ACTIVO' | 'HISTORIAL_CREDITO_INACTIVO'
>;

export type EvidenciasHistorialCredito = Record<
  TipoEvidenciaHistorialCredito,
  EvidenciaNegocioVista[]
>;

export type EvidenciasHistorialCreditoPendientes = Record<
  TipoEvidenciaHistorialCredito,
  EvidenciaEntrevistaPendiente[]
>;

export type ErroresEvidenciasHistorialCredito = Record<
  TipoEvidenciaHistorialCredito,
  string | null
>;
