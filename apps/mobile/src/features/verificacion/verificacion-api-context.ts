import { getAuthorizationHeaders } from '../../services/api-client';

export const VERIFICACION_CONTEXT_HEADERS = {
  'X-Crelealtad-Context': 'verificacion',
} as const;

export const VERIFICACION_REQUEST_OPTIONS = {
  headers: VERIFICACION_CONTEXT_HEADERS,
};

// Las pantallas de verificacion ya muestran su propio estado de carga. Las
// consultas no deben abrir el modal global porque varias se ejecutan al entrar
// a una integrante y ese modal bloquea tanto el desplazamiento como el regreso.
export const VERIFICACION_READ_REQUEST_OPTIONS = {
  ...VERIFICACION_REQUEST_OPTIONS,
  showProcessing: false,
};

export async function getVerificacionDocumentHeaders(): Promise<Record<string, string>> {
  return {
    ...(await getAuthorizationHeaders()),
    ...VERIFICACION_CONTEXT_HEADERS,
  };
}
