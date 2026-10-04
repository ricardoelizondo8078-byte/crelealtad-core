import type { DocumentImageCarouselPage } from '../../components/ui';
import { api, getDocumentUploadTimeoutMs } from '../../services/api-client';
import { appendDocumentFile } from '../../services/document-upload';
import type { SolicitudApiResponse } from './solicitud-api.types';

export type DocumentStatus =
  | 'PENDIENTE'
  | 'PENDIENTE_SUBIR'
  | 'SUBIENDO'
  | 'SINCRONIZADO'
  | 'ERROR'
  | 'OPCIONAL';

export type DocumentoApiClave =
  | 'ine'
  | 'comprobante'
  | 'ine_beneficiario'
  | 'solicitud_firmada'
  | 'comprobante_credito';

export interface DocumentoRequerido {
  id: string;
  nombre: string;
  obligatorio: boolean;
  status: DocumentStatus;
  uriFrente?: string;
  uriReverso?: string;
  urisLocales?: string[];
  rutaServidor?: string;
}

export interface DocumentoRemoto {
  id: string;
  ruta: string;
  archivos: Array<{ indice: number; mime_type: string; url: string }>;
}

export interface DocumentoViewerState {
  title: string;
  pages: Array<{ uri: string; headers: Record<string, string>; mimeType: string }>;
}

export interface DocumentoCarouselState {
  title: string;
  pages: DocumentImageCarouselPage[];
}

export const DOCUMENTOS_REQUERIDOS: DocumentoRequerido[] = [
  { id: 'ine_integrante', nombre: 'INE Integrante', obligatorio: true, status: 'PENDIENTE' },
  { id: 'comprobante_domicilio', nombre: 'Comprobante de Domicilio', obligatorio: true, status: 'PENDIENTE' },
  { id: 'solicitud_firmada', nombre: 'Solicitud Firmada', obligatorio: true, status: 'PENDIENTE' },
  { id: 'ine_beneficiario', nombre: 'INE Beneficiario', obligatorio: false, status: 'OPCIONAL' },
  { id: 'comprobante_linea_credito', nombre: 'Comprobante Línea de Crédito', obligatorio: false, status: 'OPCIONAL' },
];

export const TIPOS_DOCUMENTO_API: Record<string, DocumentoApiClave> = {
  ine_integrante: 'ine',
  comprobante_domicilio: 'comprobante',
  ine_beneficiario: 'ine_beneficiario',
  solicitud_firmada: 'solicitud_firmada',
  comprobante_linea_credito: 'comprobante_credito',
};

export const RUTAS_DOCUMENTO: Record<string, keyof SolicitudApiResponse> = {
  ine_integrante: 'doc_ine_ruta',
  comprobante_domicilio: 'doc_comprobante_ruta',
  ine_beneficiario: 'doc_ine_beneficiario_ruta',
  solicitud_firmada: 'doc_solicitud_firmada_ruta',
  comprobante_linea_credito: 'doc_comprobante_credito_ruta',
};

const anexarArchivoDocumento = async (formData: FormData, uri: string, nombre: string) => {
  const extension = uri.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
  const normalizedExtension = extension === 'png'
    ? 'png'
    : extension === 'pdf'
      ? 'pdf'
      : 'jpg';
  await appendDocumentFile(formData, uri, `${nombre}.${normalizedExtension}`);
};

export const subirDocumentoAlServidor = async (
  integranteId: string,
  documentoId: string,
  uris: readonly string[],
): Promise<DocumentoRemoto> => {
  const tipo = TIPOS_DOCUMENTO_API[documentoId];
  if (!tipo) throw new Error('Tipo de documento no reconocido.');
  if (uris.length === 0) throw new Error('Selecciona al menos una imagen.');

  const formData = new FormData();
  for (let index = 0; index < uris.length; index += 1) {
    const uri = uris[index];
    if (!uri) continue;
    await anexarArchivoDocumento(formData, uri, `${tipo}-${index + 1}`);
  }

  return api.post<DocumentoRemoto>(
    `/solicitudes/integrante/${integranteId}/documentos/${tipo}`,
    formData,
    {
      timeoutMs: getDocumentUploadTimeoutMs(uris.length),
      showProcessing: false,
    },
  );
};
