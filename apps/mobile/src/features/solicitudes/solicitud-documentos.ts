import type { DocumentImageCarouselPage } from '../../components/ui';
import {
  uploadDocumentFiles,
  type DocumentoRemoto,
} from '../../services/document-upload';
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
  | 'control_pagos'
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
  cantidadImagenesRequerida?: number;
}

export type { DocumentoRemoto } from '../../services/document-upload';

export interface DocumentoViewerState {
  title: string;
  pages: { uri: string; headers: Record<string, string>; mimeType: string }[];
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

export const crearDocumentosRequeridos = (
  esIntegranteCicloDosMas: boolean,
): DocumentoRequerido[] => {
  const documentos = DOCUMENTOS_REQUERIDOS.map((documento) => ({ ...documento }));
  if (!esIntegranteCicloDosMas) return documentos;

  return [
    {
      id: 'control_pagos_crelealtad',
      nombre: 'Control de pagos CRELEALTAD',
      obligatorio: true,
      status: 'PENDIENTE',
      cantidadImagenesRequerida: 2,
    },
    ...documentos,
  ];
};

export const reconciliarDocumentosRequeridos = (
  documentosGuardados: readonly DocumentoRequerido[],
  esIntegranteCicloDosMas: boolean,
): DocumentoRequerido[] => crearDocumentosRequeridos(esIntegranteCicloDosMas).map((documentoBase) => {
  const guardado = documentosGuardados.find((documento) => documento.id === documentoBase.id);
  if (!guardado) return documentoBase;

  return {
    ...documentoBase,
    ...guardado,
    nombre: documentoBase.nombre,
    obligatorio: documentoBase.obligatorio,
    cantidadImagenesRequerida: documentoBase.cantidadImagenesRequerida,
  };
});

export const TIPOS_DOCUMENTO_API: Record<string, DocumentoApiClave> = {
  ine_integrante: 'ine',
  comprobante_domicilio: 'comprobante',
  ine_beneficiario: 'ine_beneficiario',
  solicitud_firmada: 'solicitud_firmada',
  control_pagos_crelealtad: 'control_pagos',
  comprobante_linea_credito: 'comprobante_credito',
};

export const RUTAS_DOCUMENTO: Record<string, keyof SolicitudApiResponse> = {
  ine_integrante: 'doc_ine_ruta',
  comprobante_domicilio: 'doc_comprobante_ruta',
  ine_beneficiario: 'doc_ine_beneficiario_ruta',
  solicitud_firmada: 'doc_solicitud_firmada_ruta',
  control_pagos_crelealtad: 'doc_control_pagos_ruta',
  comprobante_linea_credito: 'doc_comprobante_credito_ruta',
};

export const subirDocumentoAlServidor = async (
  integranteId: string,
  documentoId: string,
  uris: readonly string[],
): Promise<DocumentoRemoto> => {
  const tipo = TIPOS_DOCUMENTO_API[documentoId];
  if (!tipo) throw new Error('Tipo de documento no reconocido.');
  return uploadDocumentFiles(integranteId, tipo, uris);
};
