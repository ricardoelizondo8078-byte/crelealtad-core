export const TIPOS_DOCUMENTO = [
  'ine',
  'comprobante',
  'ine_beneficiario',
  'solicitud_firmada',
  'comprobante_credito',
] as const;

export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

export interface ArchivoDocumentoRecibido {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export interface ArchivoDocumentoGuardado {
  indice: number;
  nombre: string;
  mime_type: string;
  tamano: number;
  url: string;
}

export interface DocumentoGuardado {
  id: string;
  integrante_id: string;
  tipo: TipoDocumento;
  ruta: string;
  fecha_captura: string;
  usuario_id: string;
  archivos: ArchivoDocumentoGuardado[];
}

export interface CargaDocumentoInput {
  carga_id?: string;
  indice_inicio?: number;
  total_archivos?: number;
  finalizar?: boolean;
}

export interface ResultadoCargaDocumento {
  carga_id: string;
  recibidos: number;
  total_archivos: number;
  completado: boolean;
  documento?: DocumentoGuardado;
}
